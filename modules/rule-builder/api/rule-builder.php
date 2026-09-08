<?php
/**
 * Rule-builder module API.
 * Actions:
 *   - status: identify the current tournament (name, type, dates) for the screen.
 *   - download: build and download the ruleset JSON for the current tournament.
 */
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . '/../../../core/adapters/ianseo/acl/acl.php');
require_once(__DIR__ . '/../application/RuleBuilderExportService.php');

$access = array(
    'acl' => 'AclModules',
    'subFeature' => 'ruleBuilder',
    'read' => 'AclReadOnly',
    'write' => 'AclReadWrite',
);

try {
    if (function_exists('CheckTourSession')) {
        CheckTourSession(true);
    }
    ffta_acl_require($access, 'read');

    $service = new RuleBuilderExportService();
    $action = isset($_GET['action']) ? trim($_GET['action']) : '';

    switch ($action) {
        case 'status':
            echo json_encode(array('ok' => true, 'data' => $service->getStatus()));
            break;

        case 'download':
            $status = $service->getStatus();
            $ruleset = $service->buildForTournament($status['tournamentId']);
            $filename = 'rule-builder-' . preg_replace('/[^A-Za-z0-9_-]/', '_', $status['typeSubRule'] ?: 'export')
                . '-' . $status['tournamentId'] . '.json';

            $content = json_encode($ruleset, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
            header('Content-Type: application/json; charset=utf-8');
            header('Content-Disposition: attachment; filename=' . $filename);
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . strlen($content));
            echo $content;
            break;

        default:
            http_response_code(400);
            echo json_encode(array('ok' => false, 'error' => "Unknown action: {$action}"));
    }
} catch (Exception $error) {
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
