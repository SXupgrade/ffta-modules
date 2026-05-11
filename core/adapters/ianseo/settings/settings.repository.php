<?php
require_once(__DIR__ . '/ModulesParametersAdapter.php');

/**
 * HTTP endpoint handler for core settings API.
 * Mounted at api/settings.php (relative to the module root).
 *
 * Consumed by core/adapters/ianseo/settings/settingsAdapter.js via fetch().
 *
 * Supported actions:
 *   GET  ?action=get&key=<key>            → { ok, value }
 *   POST ?action=set  body: { key, value } → { ok }
 */
function ffta_settings_handle_request() {
    $adapter = new ModulesParametersAdapter('ffta-modules');
    $action  = isset($_GET['action']) ? $_GET['action'] : '';

    if ($action === 'get') {
        $key   = isset($_GET['key']) ? trim($_GET['key']) : '';
        if ($key === '') {
            http_response_code(400);
            echo json_encode(array('ok' => false, 'error' => 'Missing key parameter'));
            return;
        }
        $value = $adapter->get($key);
        echo json_encode(array('ok' => true, 'value' => $value));
        return;
    }

    if ($action === 'set') {
        $body = json_decode(file_get_contents('php://input'), true);
        $key  = isset($body['key'])   ? trim($body['key'])  : '';
        if ($key === '' || !array_key_exists('value', $body)) {
            http_response_code(400);
            echo json_encode(array('ok' => false, 'error' => 'Missing key or value'));
            return;
        }
        $adapter->set($key, $body['value']);
        echo json_encode(array('ok' => true));
        return;
    }

    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'Unknown action'));
}
