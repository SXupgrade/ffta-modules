<?php
header('Content-Type: application/json');

require_once(__DIR__ . '/../application/GdprPublishService.php');
require_once(__DIR__ . '/../../../core/adapters/ianseo/acl/acl.php');

try {
    if (function_exists('CheckTourSession')) {
        CheckTourSession(true);
    }

    // Same ACL bit Ianseo's own "Send to Ianseo.net" screen gates itself
    // on (Tournament/UploadResults-upload.php:43) -- this module opens no
    // new permission surface, it only reroutes an already-authorized
    // action through a redaction pass first.
    $access = array(
        'acl' => 'AclInternetPublish',
        'subFeature' => 'ipSend',
        'read' => 'AclReadOnly',
        'write' => 'AclReadWrite',
    );

    $action = isset($_GET['action']) ? trim($_GET['action']) : '';
    $service = new GdprPublishService();

    switch ($action) {
        case 'status':
            ffta_acl_require($access, 'read');
            echo json_encode(array('ok' => true, 'data' => $service->getStatus()));
            break;

        case 'preview':
            ffta_acl_require($access, 'write');
            $selection = json_decode(file_get_contents('php://input'), true);
            if (!is_array($selection)) {
                http_response_code(400);
                echo json_encode(array('ok' => false, 'error' => 'Invalid JSON payload'));
                break;
            }
            $built = $service->buildPayload($selection);
            // json_encode(), not the real gzcompress(serialize(...)) blob --
            // this is a human-readable dry run for verifying redaction
            // before ever hitting the live ianseo.net endpoint, not what
            // actually gets sent. See README "Verification before
            // production use".
            echo json_encode(array('ok' => true, 'data' => array(
                'optedOutCount' => $built['optedOutCount'],
                'payload' => $built['ret'],
            )));
            break;

        case 'publish':
            ffta_acl_require($access, 'write');
            $selection = json_decode(file_get_contents('php://input'), true);
            if (!is_array($selection)) {
                http_response_code(400);
                echo json_encode(array('ok' => false, 'error' => 'Invalid JSON payload'));
                break;
            }
            echo json_encode(array('ok' => true, 'data' => $service->publish($selection)));
            break;

        default:
            http_response_code(400);
            echo json_encode(array('ok' => false, 'error' => "Unknown action: {$action}"));
    }
} catch (Exception $error) {
    http_response_code(500);
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
