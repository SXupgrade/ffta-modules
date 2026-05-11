<?php
/**
 * Ianseo bootstrap adapter.
 *
 * TODO for agent:
 * - Inspect public Ianseo sources and replace this placeholder with the correct include path.
 * - This file must be included by all PHP endpoints before DB/session usage.
 * - Never request DB credentials from the user; reuse host Ianseo config.
 */

$possibleConfigFiles = array(
    __DIR__ . '/../../../../../../config.php',
    __DIR__ . '/../../../../../config.php',
    __DIR__ . '/../../../../config.php'
);

foreach ($possibleConfigFiles as $configFile) {
    if (file_exists($configFile)) {
        require_once($configFile);
        return;
    }
}

http_response_code(500);
echo json_encode(array(
    'ok' => false,
    'error' => 'Unable to locate Ianseo config.php. Install path must be Modules/Custom/ffta-modules.'
));
exit;
