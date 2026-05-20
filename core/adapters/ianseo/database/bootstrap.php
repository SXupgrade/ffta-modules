<?php
/**
 * Ianseo bootstrap adapter.
 *
 * Install path:
 *   Modules/Custom/ffta-modules
 *
 * This file must reuse the host Ianseo runtime: configuration, include path,
 * session, language helpers, ACL helpers and database helpers. It must never
 * ask for host/user/password and must never create a second DB configuration.
 */
if (defined('FFTA_IANSEO_BOOTSTRAPPED')) {
    return;
}

$rootConfig = dirname(dirname(dirname(dirname(dirname(dirname(dirname(__FILE__))))))) . '/config.php';

if (!file_exists($rootConfig)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array(
        'ok' => false,
        'error' => 'Unable to locate Ianseo config.php. Install ffta-modules at Modules/Custom/ffta-modules.'
    ));
    exit;
}

require_once($rootConfig);
define('FFTA_IANSEO_BOOTSTRAPPED', true);
