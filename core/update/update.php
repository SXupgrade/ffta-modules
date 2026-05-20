<?php
/**
 * Minimal self-update endpoint for ffta-modules.
 *
 * This intentionally keeps the update flow simple:
 *   1. download the latest GitHub release zip,
 *   2. extract it to a temporary directory,
 *   3. copy/overwrite files into the current module directory,
 *   4. remove temporary files.
 *
 * No backup is created by design. If the module is broken after an update,
 * reinstall the release zip manually in Modules/Custom/ffta-modules.
 */
require_once(dirname(dirname(__DIR__)) . '/core/adapters/ianseo/database/bootstrap.php');

header('Content-Type: application/json; charset=utf-8');

$action = isset($_GET['action']) ? $_GET['action'] : '';
if ($action !== 'install') {
    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'Unknown action'));
    exit;
}

// Change this URL if the final FFTA GitHub organization/repository differs.
$releaseUrl = 'https://github.com/FFTA/ffta-modules/releases/latest/download/ffta-modules.zip';
$moduleRoot = dirname(dirname(__DIR__));
$tmpBase = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'ffta-modules-update-' . uniqid('', true);
$tmpZip = $tmpBase . DIRECTORY_SEPARATOR . 'ffta-modules.zip';
$tmpExtract = $tmpBase . DIRECTORY_SEPARATOR . 'extracted';

try {
    if (!extension_loaded('zip')) {
        throw new RuntimeException('PHP zip extension is required to update the module.');
    }

    if (!is_writable($moduleRoot)) {
        throw new RuntimeException('Module directory is not writable.');
    }

    if (!mkdir($tmpBase, 0777, true) && !is_dir($tmpBase)) {
        throw new RuntimeException('Unable to create temporary update directory.');
    }

    downloadFile($releaseUrl, $tmpZip);
    extractZip($tmpZip, $tmpExtract);

    $payloadRoot = resolvePayloadRoot($tmpExtract);
    copyDirectoryContents($payloadRoot, $moduleRoot);
    removeDirectory($tmpBase);

    echo json_encode(array('ok' => true));
} catch (Exception $error) {
    if (is_dir($tmpBase)) {
        removeDirectory($tmpBase);
    }
    http_response_code(500);
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}

function downloadFile($url, $destination) {
    $fp = fopen($destination, 'wb');
    if (!$fp) {
        throw new RuntimeException('Unable to create temporary zip file.');
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_FAILONERROR, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120);
        curl_setopt($ch, CURLOPT_USERAGENT, 'ffta-modules-updater');
        $ok = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);
        fclose($fp);
        if (!$ok) {
            @unlink($destination);
            throw new RuntimeException('Unable to download update package: ' . $error);
        }
        return;
    }

    $context = stream_context_create(array(
        'http' => array(
            'follow_location' => 1,
            'timeout' => 120,
            'header' => "User-Agent: ffta-modules-updater\r\n"
        )
    ));
    $data = @file_get_contents($url, false, $context);
    fclose($fp);
    if ($data === false) {
        @unlink($destination);
        throw new RuntimeException('Unable to download update package.');
    }
    file_put_contents($destination, $data);
}

function extractZip($zipPath, $destination) {
    if (!mkdir($destination, 0777, true) && !is_dir($destination)) {
        throw new RuntimeException('Unable to create extraction directory.');
    }

    $zip = new ZipArchive();
    if ($zip->open($zipPath) !== true) {
        throw new RuntimeException('Unable to open update zip.');
    }

    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = $zip->getNameIndex($i);
        if (strpos($name, '..') !== false || strpos($name, ':') !== false || strpos($name, '\\') !== false) {
            $zip->close();
            throw new RuntimeException('Unsafe path found in update zip: ' . $name);
        }
    }

    if (!$zip->extractTo($destination)) {
        $zip->close();
        throw new RuntimeException('Unable to extract update zip.');
    }
    $zip->close();
}

function resolvePayloadRoot($extractDir) {
    $directRoot = $extractDir . DIRECTORY_SEPARATOR . 'ffta-modules';
    if (is_dir($directRoot)) {
        return $directRoot;
    }

    $entries = array_values(array_filter(scandir($extractDir), function ($entry) use ($extractDir) {
        return $entry !== '.' && $entry !== '..' && is_dir($extractDir . DIRECTORY_SEPARATOR . $entry);
    }));

    if (count($entries) === 1) {
        $candidate = $extractDir . DIRECTORY_SEPARATOR . $entries[0];
        if (file_exists($candidate . DIRECTORY_SEPARATOR . 'index.php') || is_dir($candidate . DIRECTORY_SEPARATOR . 'core')) {
            return $candidate;
        }
    }

    return $extractDir;
}

function copyDirectoryContents($source, $destination) {
    $items = scandir($source);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || $item === '.git') {
            continue;
        }

        $sourcePath = $source . DIRECTORY_SEPARATOR . $item;
        $destinationPath = $destination . DIRECTORY_SEPARATOR . $item;

        if (is_dir($sourcePath)) {
            if (!is_dir($destinationPath) && !mkdir($destinationPath, 0777, true)) {
                throw new RuntimeException('Unable to create directory: ' . $destinationPath);
            }
            copyDirectoryContents($sourcePath, $destinationPath);
            continue;
        }

        if (!copy($sourcePath, $destinationPath)) {
            throw new RuntimeException('Unable to copy file: ' . $destinationPath);
        }
    }
}

function removeDirectory($dir) {
    if (!is_dir($dir)) {
        return;
    }

    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path)) {
            removeDirectory($path);
        } else {
            @unlink($path);
        }
    }
    @rmdir($dir);
}
