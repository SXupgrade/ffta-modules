<?php
header('Content-Type: application/json');

require_once(__DIR__ . '/../repositories/ianseo/IanseoRecordsRepository.php');
require_once(__DIR__ . '/../../../core/adapters/ianseo/acl/acl.php');

try {
    $action = isset($_GET['action']) ? trim($_GET['action']) : '';
    $repository = new IanseoRecordsRepository();
    $recordsAccess = array(
        'acl' => 'AclModules',
        'subFeature' => 'fftaRecords',
        'read' => 'AclReadOnly',
        'write' => 'AclReadWrite'
    );

    switch ($action) {
        case 'getDashboard':
            ffta_acl_require($recordsAccess, 'read');
            echo json_encode(array('ok' => true, 'data' => $repository->getDashboard()));
            break;


        case 'saveRecordArea':
            ffta_acl_require($recordsAccess, 'write');
            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                http_response_code(400);
                echo json_encode(array('ok' => false, 'error' => 'Invalid JSON payload'));
                break;
            }
            $repository->saveRecordAreaFromPayload($payload);
            echo json_encode(array('ok' => true));
            break;

        case 'deleteRecordArea':
            ffta_acl_require($recordsAccess, 'write');
            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                http_response_code(400);
                echo json_encode(array('ok' => false, 'error' => 'Invalid JSON payload'));
                break;
            }
            $repository->deleteRecordArea($payload);
            echo json_encode(array('ok' => true));
            break;

        case 'syncTournamentRecordAreas':
            ffta_acl_require($recordsAccess, 'write');
            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                http_response_code(400);
                echo json_encode(array('ok' => false, 'error' => 'Invalid JSON payload'));
                break;
            }
            echo json_encode(array('ok' => true, 'data' => $repository->syncTournamentRecordAreas($payload)));
            break;

        case 'updateGlobalRecordsFromBroken':
            ffta_acl_require($recordsAccess, 'write');
            echo json_encode(array('ok' => true, 'data' => $repository->updateGlobalRecordsFromBroken()));
            break;

        case 'saveMonitoredRecord':
            ffta_acl_require($recordsAccess, 'write');
            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                http_response_code(400);
                echo json_encode(array('ok' => false, 'error' => 'Invalid JSON payload'));
                break;
            }
            $repository->saveMonitoredRecord($payload);
            echo json_encode(array('ok' => true));
            break;


        case 'saveRecord':
            ffta_acl_require($recordsAccess, 'write');
            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                http_response_code(400);
                echo json_encode(array('ok' => false, 'error' => 'Invalid JSON payload'));
                break;
            }
            $repository->saveRecord($payload);
            echo json_encode(array('ok' => true));
            break;

        case 'importRecords':
            ffta_acl_require($recordsAccess, 'write');
            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                http_response_code(400);
                echo json_encode(array('ok' => false, 'error' => 'Invalid JSON payload'));
                break;
            }
            echo json_encode(array('ok' => true, 'imported' => $repository->importRecords($payload)));
            break;

        case 'activateTournamentRecords':
            ffta_acl_require($recordsAccess, 'write');
            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                http_response_code(400);
                echo json_encode(array('ok' => false, 'error' => 'Invalid JSON payload'));
                break;
            }
            echo json_encode(array('ok' => true, 'data' => $repository->activateTournamentRecords($payload)));
            break;

        case 'checkBrokenRecords':
            ffta_acl_require($recordsAccess, 'write');
            echo json_encode(array('ok' => true, 'data' => $repository->checkBrokenRecords()));
            break;

        default:
            http_response_code(400);
            echo json_encode(array('ok' => false, 'error' => "Unknown action: {$action}"));
    }
} catch (Exception $error) {
    http_response_code(500);
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
