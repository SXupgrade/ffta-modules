<?php
/**
 * Self-update endpoint for ffta-modules.
 *
 * Supported actions:
 *   - check: compare the local package.json version with the latest GitHub release manifest.
 *   - install: download the latest release package, verify it when possible, and copy it over the current module.
 */
require_once(dirname(dirname(__DIR__)) . '/core/adapters/ianseo/database/bootstrap.php');

header('Content-Type: application/json; charset=utf-8');

$manifestUrl = 'https://github.com/SXupgrade/ffta-modules/releases/latest/download/update-manifest.json';
$moduleRoot = dirname(dirname(__DIR__));
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    if ($action === 'check') {
        echo json_encode(checkForUpdates($moduleRoot, $manifestUrl));
        exit;
    }

    if ($action === 'install') {
        echo json_encode(installUpdate($moduleRoot, $manifestUrl));
        exit;
    }

    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'Unknown action'));
} catch (Exception $error) {
    http_response_code(500);
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}

function checkForUpdates($moduleRoot, $manifestUrl) {
    $localPackage = readLocalPackage($moduleRoot);
    $remoteManifest = readRemoteManifest($manifestUrl);

    $currentVersion = isset($localPackage['version']) ? $localPackage['version'] : '0.0.0';
    $latestVersion = isset($remoteManifest['version']) ? $remoteManifest['version'] : '0.0.0';

    return array(
        'ok' => true,
        'currentVersion' => $currentVersion,
        'latestVersion' => $latestVersion,
        'hasUpdate' => version_compare($latestVersion, $currentVersion, '>'),
        'channel' => isset($remoteManifest['channel']) ? $remoteManifest['channel'] : 'stable',
        'notes' => isset($remoteManifest['notes']) ? $remoteManifest['notes'] : ''
    );
}

function installUpdate($moduleRoot, $manifestUrl) {
    if (!extension_loaded('zip')) {
        throw new RuntimeException('PHP zip extension is required to update the module.');
    }

    if (!is_writable($moduleRoot)) {
        throw new RuntimeException('Module directory is not writable.');
    }

    $remoteManifest = readRemoteManifest($manifestUrl);
    $asset = isset($remoteManifest['asset']) ? trim($remoteManifest['asset']) : '';
    if ($asset === '') {
        throw new RuntimeException('Update manifest does not define an asset.');
    }

    if (strpos($asset, '://') !== false) {
        $releaseUrl = $asset;
    } else {
        $releaseUrl = 'https://github.com/SXupgrade/ffta-modules/releases/latest/download/' . rawurlencode($asset);
    }

    $tmpBase = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'ffta-modules-update-' . uniqid('', true);
    $tmpZip = $tmpBase . DIRECTORY_SEPARATOR . $asset;
    $tmpExtract = $tmpBase . DIRECTORY_SEPARATOR . 'extracted';

    try {
        if (!mkdir($tmpBase, 0777, true) && !is_dir($tmpBase)) {
            throw new RuntimeException('Unable to create temporary update directory.');
        }

        downloadFile($releaseUrl, $tmpZip);

        if (!empty($remoteManifest['sha256'])) {
            $actualHash = hash_file('sha256', $tmpZip);
            if (!hash_equals(strtolower($remoteManifest['sha256']), strtolower($actualHash))) {
                throw new RuntimeException('Downloaded update package checksum does not match the manifest.');
            }
        }

        extractZip($tmpZip, $tmpExtract);

        $payloadRoot = resolvePayloadRoot($tmpExtract);
        validatePayloadRoot($payloadRoot);
        copyDirectoryContents($payloadRoot, $moduleRoot);
        removeDirectory($tmpBase);

        return array(
            'ok' => true,
            'installedVersion' => isset($remoteManifest['version']) ? $remoteManifest['version'] : null
        );
    } catch (Exception $error) {
        if (is_dir($tmpBase)) {
            removeDirectory($tmpBase);
        }
        throw $error;
    }
}

function readLocalPackage($moduleRoot) {
    $packagePath = $moduleRoot . DIRECTORY_SEPARATOR . 'package.json';
    if (!file_exists($packagePath)) {
        throw new RuntimeException('Local package.json not found.');
    }

    $package = json_decode(file_get_contents($packagePath), true);
    if (!$package || !isset($package['version'])) {
        throw new RuntimeException('Invalid local package.json.');
    }

    return $package;
}

function readRemoteManifest($manifestUrl) {
    $manifestPath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'ffta-modules-update-manifest-' . uniqid('', true) . '.json';
    downloadFile($manifestUrl, $manifestPath);
    $manifest = json_decode(file_get_contents($manifestPath), true);
    @unlink($manifestPath);

    if (!$manifest || !isset($manifest['version'])) {
        throw new RuntimeException('Invalid remote update manifest.');
    }

    if (isset($manifest['id']) && $manifest['id'] !== 'ffta-modules') {
        throw new RuntimeException('Remote update manifest does not target ffta-modules.');
    }

    return $manifest;
}

function validatePayloadRoot($payloadRoot) {
    if (!is_dir($payloadRoot)) {
        throw new RuntimeException('Invalid update package payload.');
    }

    $packagePath = $payloadRoot . DIRECTORY_SEPARATOR . 'package.json';
    if (!file_exists($packagePath)) {
        throw new RuntimeException('Update package does not contain package.json.');
    }

    $package = json_decode(file_get_contents($packagePath), true);
    if (!$package || !isset($package['name']) || $package['name'] !== 'ffta-modules') {
        throw new RuntimeException('Update package is not a valid ffta-modules package.');
    }
}

function downloadFile($url, $destination) {
    $parent = dirname($destination);
    if (!is_dir($parent) && !mkdir($parent, 0777, true)) {
        throw new RuntimeException('Unable to create download directory.');
    }

    $fp = fopen($destination, 'wb');
    if (!$fp) {
        throw new RuntimeException('Unable to create temporary file.');
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
            throw new RuntimeException('Unable to download file: ' . $error);
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
        throw new RuntimeException('Unable to download file.');
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
        $rawName = $zip->getNameIndex($i);
        $safeName = normalizeZipEntryName($rawName);

        if ($safeName === '') {
            continue;
        }

        $targetPath = $destination . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $safeName);

        if (substr($safeName, -1) === '/') {
            if (!is_dir($targetPath) && !mkdir($targetPath, 0777, true)) {
                $zip->close();
                throw new RuntimeException('Unable to create directory from update zip: ' . $safeName);
            }
            continue;
        }

        $parent = dirname($targetPath);
        if (!is_dir($parent) && !mkdir($parent, 0777, true)) {
            $zip->close();
            throw new RuntimeException('Unable to create directory from update zip: ' . $parent);
        }

        $source = $zip->getStream($rawName);
        if (!$source) {
            $zip->close();
            throw new RuntimeException('Unable to read update zip entry: ' . $rawName);
        }

        $target = fopen($targetPath, 'wb');
        if (!$target) {
            fclose($source);
            $zip->close();
            throw new RuntimeException('Unable to write update zip entry: ' . $targetPath);
        }

        stream_copy_to_stream($source, $target);
        fclose($source);
        fclose($target);
    }

    $zip->close();
}

function normalizeZipEntryName($name) {
    $normalized = str_replace('\\', '/', $name);
    $normalized = ltrim($normalized, '/');

    if ($normalized === '') {
        return '';
    }

    if (strpos($normalized, "\0") !== false || strpos($normalized, ':') !== false) {
        throw new RuntimeException('Unsafe path found in update zip: ' . $name);
    }

    $parts = explode('/', $normalized);
    foreach ($parts as $part) {
        if ($part === '..') {
            throw new RuntimeException('Unsafe path found in update zip: ' . $name);
        }
    }

    return $normalized;
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
        if (shouldSkipUpdatePath($item)) {
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

function shouldSkipUpdatePath($item) {
    $skipped = array(
        '.',
        '..',
        '.git',
        '.github',
        'node_modules',
        'lab',
        'examples',
        'patch-notes',
        'temp',
        'dist'
    );

    return in_array($item, $skipped, true);
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
