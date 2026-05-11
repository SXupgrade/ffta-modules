<?php
/**
 * League module API entry point.
 *
 * Supported actions (via ?action=):
 *   getLeagueInput  — full input for JS domain calculation
 *   getStandings    — convenience alias (same as getLeagueInput)
 *   getContext      — master tournament and round summary
 *   saveSettings    — persist league settings (POST)
 *   recalculate     — force recalculation signal (currently same as getLeagueInput)
 */
header('Content-Type: application/json');

require_once(__DIR__ . '/../repositories/ianseo/IanseoLeagueRepository.php');

try {
    $action     = isset($_GET['action']) ? trim($_GET['action']) : '';
    $repository = new IanseoLeagueRepository();

    switch ($action) {

        case 'getLeagueInput':
        case 'getStandings':
            $input = $repository->getLeagueInput();
            echo json_encode(array('ok' => true, 'data' => $input));
            break;

        case 'getContext':
            require_once(__DIR__ . '/actions/getContext.php');
            echo json_encode(league_action_get_context($repository));
            break;

        case 'saveSettings':
            require_once(__DIR__ . '/actions/saveSettings.php');
            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                http_response_code(400);
                echo json_encode(array('ok' => false, 'error' => 'Invalid JSON payload'));
                break;
            }
            echo json_encode(league_action_save_settings($repository, $payload));
            break;

        case 'recalculate':
            $input = $repository->getLeagueInput();
            echo json_encode(array('ok' => true, 'data' => $input, 'recalculated' => true));
            break;

        default:
            http_response_code(400);
            echo json_encode(array('ok' => false, 'error' => "Unknown action: {$action}"));
    }

} catch (Exception $error) {
    http_response_code(500);
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
