<?php
header('Content-Type: application/json');
require_once(__DIR__ . '/../repositories/ianseo/IanseoLeagueRepository.php');

try {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    $repository = new IanseoLeagueRepository();

    if ($action === 'getLeagueInput') {
        echo json_encode(array('ok' => true, 'data' => $repository->getLeagueInput()));
        exit;
    }

    if ($action === 'saveSettings') {
        $payload = json_decode(file_get_contents('php://input'), true);
        $repository->saveSettings($payload);
        echo json_encode(array('ok' => true));
        exit;
    }

    http_response_code(400);
    echo json_encode(array('ok' => false, 'error' => 'Unknown action'));
} catch (Exception $error) {
    http_response_code(500);
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
