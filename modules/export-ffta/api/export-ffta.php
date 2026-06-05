<?php
/**
 * Export FFTA module API.
 * Actions:
 *   - download: generate and download the official TXT from the active tournament.
 *   - tnrActive: generate from active tournament and compare with tests/expected/*.txt.
 */
require_once(__DIR__ . '/../../../core/adapters/ianseo/database/query.php');
require_once(__DIR__ . '/../../../core/adapters/ianseo/acl/acl.php');
require_once(__DIR__ . '/engine/FftaExportRepository.php');
require_once(__DIR__ . '/engine/FftaExportNormalizer.php');
require_once(__DIR__ . '/engine/FftaResultLine.php');
require_once(__DIR__ . '/engine/FftaTxtRenderer.php');
require_once(__DIR__ . '/engine/FftaResultExportBuilder.php');

function export_ffta_build($tourId, $level) {
    $builder = new FftaResultExportBuilder(
        new FftaExportRepository(),
        new FftaExportNormalizer(),
        new FftaTxtRenderer()
    );
    return $builder->build((int) $tourId, $level);
}

function export_ffta_normalize_text($value) {
    $value = str_replace("
", "
", (string) $value);
    $value = str_replace("
", "
", $value);
    return rtrim($value, "
");
}

function export_ffta_compare($expected, $generated, $expectedFile) {
    $expectedNormalized = export_ffta_normalize_text($expected);
    $generatedNormalized = export_ffta_normalize_text($generated);
    $expectedLines = explode("
", $expectedNormalized);
    $generatedLines = explode("
", $generatedNormalized);
    $max = max(count($expectedLines), count($generatedLines));
    $firstDifference = null;
    for ($i = 0; $i < $max; $i++) {
        $left = isset($expectedLines[$i]) ? $expectedLines[$i] : '';
        $right = isset($generatedLines[$i]) ? $generatedLines[$i] : '';
        if ($left !== $right) {
            $firstDifference = array('line' => $i + 1, 'expected' => $left, 'generated' => $right);
            break;
        }
    }
    return array(
        'success' => $firstDifference === null,
        'expectedFile' => $expectedFile,
        'expectedLineCount' => count($expectedLines),
        'generatedLineCount' => count($generatedLines),
        'firstDifference' => $firstDifference
    );
}

try {
    if (function_exists('CheckTourSession')) {
        CheckTourSession(true);
    }
    ffta_acl_require(array(
        'acl' => 'AclModules',
        'subFeature' => 'fftaExport',
        'read' => 'AclReadOnly',
        'write' => 'AclReadWrite'
    ), 'read');

    $tourId = isset($_SESSION['TourId']) ? (int) $_SESSION['TourId'] : 0;
    if ($tourId <= 0) {
        throw new RuntimeException('No active Ianseo tournament found in session.');
    }

    $action = isset($_GET['action']) ? trim($_GET['action']) : '';
    $level = isset($_GET['level']) ? trim($_GET['level']) : 'S';
    if (!in_array($level, array('S', 'SP', 'N'), true)) {
        throw new RuntimeException('Invalid export level.');
    }

    if ($action === 'download') {
        $export = export_ffta_build($tourId, $level);
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename=' . $export['filename']);
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . strlen($export['content']));
        echo $export['content'];
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');

    if ($action === 'tnrActive') {
        $export = export_ffta_build($tourId, $level);
        $expected = isset($_GET['expected']) ? basename($_GET['expected']) : 'active-' . $level . '.txt';
        $expectedPath = dirname(__DIR__) . '/tests/expected/' . $expected;
        if (!file_exists($expectedPath)) {
            echo json_encode(array('ok' => true, 'report' => array(
                'success' => false,
                'missingExpected' => true,
                'expectedFile' => $expected,
                'generatedFile' => $export['filename'],
                'generatedLineCount' => count(explode("
", export_ffta_normalize_text($export['content']))),
                'generated' => $export['content']
            )));
            exit;
        }
        $report = export_ffta_compare(file_get_contents($expectedPath), $export['content'], $expected);
        $report['generatedFile'] = $export['filename'];
        echo json_encode(array('ok' => true, 'report' => $report));
        exit;
    }

    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'Unknown action: ' . $action));
} catch (Exception $error) {
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
