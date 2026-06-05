<?php
/**
 * ACL API endpoint for ffta-modules.
 *
 * The endpoint is deliberately tolerant: when Ianseo ACL helpers are not
 * available, it grants write access to preserve standalone/dev compatibility.
 */
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . '/../core/adapters/ianseo/database/bootstrap.php');
require_once(__DIR__ . '/../core/adapters/ianseo/acl/acl.php');

try {
    $action = isset($_GET['action']) ? trim($_GET['action']) : '';
    if ($action !== 'moduleAccess') {
        http_response_code(400);
        echo json_encode(array('ok' => false, 'error' => 'Unknown action: ' . $action));
        exit;
    }

    $payload = json_decode(file_get_contents('php://input'), true);
    if (!is_array($payload)) {
        $payload = array();
    }

    $access = isset($payload['access']) && is_array($payload['access']) ? $payload['access'] : array();
    $moduleId = isset($payload['moduleId']) ? preg_replace('/[^a-z0-9-]/', '', (string) $payload['moduleId']) : '';

    echo json_encode(array(
        'ok' => true,
        'moduleId' => $moduleId,
        'access' => ffta_acl_resolve_access($access)
    ));
} catch (Exception $error) {
    http_response_code(500);
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
