<?php
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . '/../../../core/adapters/ianseo/database/query.php');

try {
    if (function_exists('CheckTourSession') && !CheckTourSession()) {
        json_response(array('ok' => false, 'error' => 'No active tournament.'), 403);
    }
    if (function_exists('hasFullACL') && !hasFullACL(AclQualification, '', AclReadOnly)) {
        json_response(array('ok' => false, 'error' => 'Read access denied.'), 403);
    }

    $action = $_GET['action'] ?? 'initial';
    $payload = read_json_payload();
    $tourId = (int) ($_SESSION['TourId'] ?? 0);
    if ($tourId <= 0) {
        json_response(array('ok' => false, 'error' => 'No active tournament.'), 400);
    }

    $context = get_context($tourId);
    if (($context['locSubRule'] ?? '') !== 'SetFrBeursault') {
        json_response(array('ok' => false, 'error' => 'This endpoint is only available for SetFrBeursault tournaments.'), 403);
    }

    if ($action === 'initial') {
        json_response(array('ok' => true, 'context' => $context, 'sessions' => list_sessions($tourId)));
    }

    if ($action === 'list') {
        json_response(array('ok' => true, 'rows' => list_rows($tourId, $payload)));
    }

    if ($action === 'save') {
        if (function_exists('hasFullACL') && !hasFullACL(AclQualification, '', AclReadWrite)) {
            json_response(array('ok' => false, 'error' => 'Write access denied.'), 403);
        }
        $row = save_score($tourId, $payload);
        json_response(array('ok' => true, 'row' => $row));
    }

    json_response(array('ok' => false, 'error' => 'Unknown action.'), 400);
} catch (Exception $error) {
    json_response(array('ok' => false, 'error' => $error->getMessage()), 500);
}

function read_json_payload() {
    $raw = file_get_contents('php://input');
    if (!$raw) return array();
    $payload = json_decode($raw, true);
    return is_array($payload) ? $payload : array();
}

function json_response($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function get_context($tourId) {
    $row = ffta_fetch_one(ffta_query("SELECT ToId, ToCode, ToWhere, ToVenue, ToType, ToTypeSubRule FROM Tournament WHERE ToId=" . (int) $tourId . " LIMIT 1"));
    if (!$row) return null;
    return array(
        'id' => (int) $row->ToId,
        'code' => $row->ToCode,
        'name' => $row->ToWhere ?: ($row->ToVenue ?: $row->ToCode),
        'venue' => $row->ToVenue ?: '',
        'tourType' => (int) $row->ToType,
        'locSubRule' => $row->ToTypeSubRule ?: ($_SESSION['TourLocSubRule'] ?? '')
    );
}

function list_sessions($tourId) {
    $rows = ffta_fetch_all(ffta_query("SELECT SesOrder, SesName, SesTar4Session, SesFirstTarget FROM Session WHERE SesTournament=" . (int) $tourId . " AND SesType='Q' ORDER BY SesOrder"));
    return array_map(function ($row) {
        $first = (int) ($row->SesFirstTarget ?: 1);
        $count = (int) ($row->SesTar4Session ?: 0);
        $last = $count > 0 ? $first + $count - 1 : $first;
        $label = trim(($row->SesOrder ?: '') . ' - ' . ($row->SesName ?: 'Qualification'));
        return array('id' => (int) $row->SesOrder, 'label' => $label, 'firstTarget' => $first, 'lastTarget' => $last);
    }, $rows);
}

function list_rows($tourId, $payload) {
    $session = max(1, (int) ($payload['session'] ?? 1));
    $fromTarget = max(1, (int) ($payload['fromTarget'] ?? 1));
    $toTarget = max($fromTarget, (int) ($payload['toTarget'] ?? $fromTarget));

    $sql = "SELECT EnId, EnCode, EnName, EnFirstName, EnClass, EnDivision, CoCode,
            CONCAT(QuTarget, QuLetter) AS Target,
            QuArrow, QuD1Score, QuD1Hits, QuD1Gold, QuD1Xnine, QuScore, QuHits, QuGold, QuXnine
        FROM Entries
        INNER JOIN Qualifications ON QuId=EnId
        LEFT JOIN Countries ON CoId=EnCountry
        WHERE EnTournament=" . (int) $tourId . "
          AND EnAthlete=1
          AND EnStatus<=1
          AND QuSession=" . (int) $session . "
          AND QuTarget BETWEEN " . (int) $fromTarget . " AND " . (int) $toTarget . "
        ORDER BY QuTarget, QuLetter";

    return array_map('map_row', ffta_fetch_all(ffta_query($sql)));
}

function save_score($tourId, $payload) {
    $id = (int) ($payload['id'] ?? 0);
    $ones = normalize_count($payload['ones'] ?? 0);
    $twos = normalize_count($payload['twos'] ?? 0);
    $threes = normalize_count($payload['threes'] ?? 0);
    $fours = normalize_count($payload['fours'] ?? 0);
    $honours = $ones + $twos + $threes + $fours;
    $points = $ones + (2 * $twos) + (3 * $threes) + (4 * $fours);

    if ($id <= 0) throw new RuntimeException('Invalid archer id.');
    if ($honours < 0 || $honours > 40) throw new RuntimeException('Honours must be between 0 and 40.');

    $exists = ffta_fetch_one(ffta_query("SELECT EnId FROM Entries INNER JOIN Qualifications ON QuId=EnId WHERE EnTournament=" . (int) $tourId . " AND EnId=" . (int) $id . " LIMIT 1"));
    if (!$exists) throw new RuntimeException('Archer not found in this tournament.');

    $now = date('Y-m-d H:i:s');
    ffta_write("UPDATE Qualifications SET
        QuD1Hits=" . (int) $honours . ",
        QuD1Score=" . (int) $points . ",
        QuD1Gold=" . (int) $fours . ",
        QuD1Xnine=" . (int) $threes . ",
        QuArrow=" . (int) $honours . ",
        QuScore=QuD1Score+QuD2Score+QuD3Score+QuD4Score+QuD5Score+QuD6Score+QuD7Score+QuD8Score,
        QuGold=QuD1Gold+QuD2Gold+QuD3Gold+QuD4Gold+QuD5Gold+QuD6Gold+QuD7Gold+QuD8Gold,
        QuXnine=QuD1Xnine+QuD2Xnine+QuD3Xnine+QuD4Xnine+QuD5Xnine+QuD6Xnine+QuD7Xnine+QuD8Xnine,
        QuHits=QuD1Hits+QuD2Hits+QuD3Hits+QuD4Hits+QuD5Hits+QuD6Hits+QuD7Hits+QuD8Hits,
        QuConfirm=QuConfirm & (255-2),
        QuSigned=QuSigned & (255-2),
        QuTimestamp=" . ffta_sql_string($now) . "
        WHERE QuId=" . (int) $id);

    $row = ffta_fetch_one(ffta_query("SELECT EnId, EnCode, EnName, EnFirstName, EnClass, EnDivision, CoCode,
            CONCAT(QuTarget, QuLetter) AS Target,
            QuArrow, QuD1Score, QuD1Hits, QuD1Gold, QuD1Xnine, QuScore, QuHits, QuGold, QuXnine
        FROM Entries
        INNER JOIN Qualifications ON QuId=EnId
        LEFT JOIN Countries ON CoId=EnCountry
        WHERE EnTournament=" . (int) $tourId . " AND EnId=" . (int) $id . " LIMIT 1"));

    return map_row($row);
}

function normalize_count($value) {
    $number = (int) $value;
    return max(0, $number);
}

function map_row($row) {
    $honours = (int) ($row->QuArrow ?: $row->QuD1Hits ?: 0);
    return array(
        'id' => (int) $row->EnId,
        'license' => $row->EnCode ?: '',
        'lastName' => $row->EnName ?: '',
        'firstName' => $row->EnFirstName ?: '',
        'category' => trim(($row->EnClass ?: '') . ($row->EnDivision ?: '')),
        'clubCode' => $row->CoCode ?: '',
        'target' => $row->Target ?: '',
        'honours' => $honours,
        'points' => (int) ($row->QuD1Score ?: $row->QuScore ?: 0),
        'fours' => (int) ($row->QuD1Gold ?: 0),
        'threes' => (int) ($row->QuD1Xnine ?: 0)
    );
}
