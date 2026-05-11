<?php
/**
 * Ianseo bootstrap adapter.
 *
 * Install path: Modules/Custom/ffta-modules
 *
 * This file locates and loads the Ianseo configuration so that all database
 * helpers (safe_r_SQL, safe_w_SQL, safe_fetch, StrSafe_DB, etc.) and global
 * session variables ($_SESSION['TourId'], etc.) are available.
 *
 * The search order goes from deepest to shallowest so it works whether the
 * Ianseo root is 4 or 5 levels above this file (depending on the version).
 *
 * TODO(ianseo-verified): Confirm the exact config filename for your Ianseo
 * version. Common names are config.php and config.inc.php.
 */

if (defined('FFTA_IANSEO_BOOTSTRAPPED')) {
    return;
}

$candidates = array(
    // Ianseo installed at server root — 4 levels: Modules/Custom/ffta-modules/core/adapters/ianseo/database/
    __DIR__ . '/../../../../../../config.php',
    __DIR__ . '/../../../../../../config.inc.php',
    // 5 levels up (some installations add an extra sub-directory)
    __DIR__ . '/../../../../../../../config.php',
    __DIR__ . '/../../../../../../../config.inc.php',
);

foreach ($candidates as $configFile) {
    if (file_exists($configFile)) {
        require_once($configFile);
        define('FFTA_IANSEO_BOOTSTRAPPED', true);
        return;
    }
}

http_response_code(500);
header('Content-Type: application/json');
echo json_encode(array(
    'ok'    => false,
    'error' => 'Unable to locate Ianseo config. '
             . 'Ensure ffta-modules is installed at Modules/Custom/ffta-modules.'
));
exit;
