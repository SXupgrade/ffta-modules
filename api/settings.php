<?php
/**
 * Settings API endpoint.
 * Consumed by core/adapters/ianseo/settings/settingsAdapter.js.
 */
header('Content-Type: application/json');

require_once(__DIR__ . '/../core/adapters/ianseo/settings/settings.repository.php');

try {
    ffta_settings_handle_request();
} catch (Exception $error) {
    http_response_code(500);
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
