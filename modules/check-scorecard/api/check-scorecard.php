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

    if ($action === 'initial') {
        json_response(array(
            'ok' => true,
            'context' => get_context($tourId),
            'sessions' => list_sessions($tourId)
        ));
    }

    if ($action === 'list') {
        json_response(array('ok' => true, 'rows' => list_rows($tourId, $payload)));
    }

    if ($action === 'set-confirm') {
        if (function_exists('hasFullACL') && !hasFullACL(AclQualification, '', AclReadWrite)) {
            json_response(array('ok' => false, 'error' => 'Write access denied.'), 403);
        }
        $row = set_confirm($tourId, $payload);
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
    $row = ffta_fetch_one(ffta_query("SELECT ToId, ToCode, ToName, ToNumDist, ToNumEnds, ToMaxDistScore FROM Tournament WHERE ToId=" . (int) $tourId . " LIMIT 1"));
    if (!$row) return null;
    $numDistances = max(0, min(8, (int) $row->ToNumDist));
    return array(
        'id' => (int) $row->ToId,
        'code' => $row->ToCode ?: '',
        'name' => $row->ToName ?: $row->ToCode,
        'numDistances' => $numDistances,
        'numEnds' => (int) $row->ToNumEnds,
        'maxDistanceScore' => (int) $row->ToMaxDistScore,
        'fullConfirmMask' => (int) (pow(2, $numDistances + 1) - 2)
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
    $context = get_context($tourId);
    $session = max(1, (int) ($payload['session'] ?? 1));
    $select = build_score_select($context['numDistances']);

    $sql = "SELECT EnId, EnCode, EnName, EnFirstName, EnClass, EnDivision, CoCode, CoName,
            CONCAT(QuTarget, QuLetter) AS Target,
            QuScore, QuHits, QuGold, QuXnine, QuTieBreak, QuConfirm" . $select . "
        FROM Entries
        INNER JOIN Qualifications ON QuId=EnId
        LEFT JOIN Countries ON CoId=EnCountry
        WHERE EnTournament=" . (int) $tourId . "
          AND EnAthlete=1
          AND EnStatus<=1
          AND QuSession=" . (int) $session . "
        ORDER BY QuTarget, QuLetter, EnName, EnFirstName";

    return array_map(function ($row) use ($context) {
        return map_row($row, $context['numDistances']);
    }, ffta_fetch_all(ffta_query($sql)));
}

function set_confirm($tourId, $payload) {
    $context = get_context($tourId);
    $id = (int) ($payload['id'] ?? 0);
    $distance = (int) ($payload['distance'] ?? 0);
    $confirmed = !empty($payload['confirmed']);

    if ($id <= 0) throw new RuntimeException('Invalid archer id.');
    if ($distance < 0 || $distance > $context['numDistances']) throw new RuntimeException('Invalid QuConfirm bit.');

    $exists = ffta_fetch_one(ffta_query("SELECT EnId FROM Entries INNER JOIN Qualifications ON QuId=EnId WHERE EnTournament=" . (int) $tourId . " AND EnId=" . (int) $id . " LIMIT 1"));
    if (!$exists) throw new RuntimeException('Archer not found in this tournament.');

    $bit = (int) pow(2, $distance);
    if ($confirmed) {
        ffta_write("UPDATE Qualifications SET QuConfirm=QuConfirm | " . (int) $bit . " WHERE QuId=" . (int) $id);
    } else {
        ffta_write("UPDATE Qualifications SET QuConfirm=QuConfirm - IF((QuConfirm & " . (int) $bit . ") != 0, " . (int) $bit . ", 0) WHERE QuId=" . (int) $id);
    }

    return get_row($tourId, $id, $context['numDistances']);
}

function get_row($tourId, $id, $numDistances) {
    $select = build_score_select($numDistances);
    $row = ffta_fetch_one(ffta_query("SELECT EnId, EnCode, EnName, EnFirstName, EnClass, EnDivision, CoCode, CoName,
            CONCAT(QuTarget, QuLetter) AS Target,
            QuScore, QuHits, QuGold, QuXnine, QuTieBreak, QuConfirm" . $select . "
        FROM Entries
        INNER JOIN Qualifications ON QuId=EnId
        LEFT JOIN Countries ON CoId=EnCountry
        WHERE EnTournament=" . (int) $tourId . " AND EnId=" . (int) $id . " LIMIT 1"));
    if (!$row) throw new RuntimeException('Archer not found.');
    return map_row($row, $numDistances);
}

function build_score_select($numDistances) {
    $parts = array();
    for ($distance = 1; $distance <= $numDistances; $distance++) {
        $prefix = 'QuD' . $distance;
        $parts[] = $prefix . 'Score';
        $parts[] = $prefix . 'Hits';
        $parts[] = $prefix . 'Gold';
        $parts[] = $prefix . 'Xnine';
        $parts[] = $prefix . 'Arrowstring';
    }
    return empty($parts) ? '' : ', ' . implode(', ', $parts);
}

function map_row($row, $numDistances) {
    $quConfirm = (int) ($row->QuConfirm ?: 0);
    $distances = array();
    for ($distance = 1; $distance <= $numDistances; $distance++) {
        $scoreField = 'QuD' . $distance . 'Score';
        $hitsField = 'QuD' . $distance . 'Hits';
        $goldField = 'QuD' . $distance . 'Gold';
        $xnineField = 'QuD' . $distance . 'Xnine';
        $arrowField = 'QuD' . $distance . 'Arrowstring';
        $bit = (int) pow(2, $distance);
        $distances[] = array(
            'index' => $distance,
            'bit' => $bit,
            'confirmed' => (($quConfirm & $bit) !== 0),
            'score' => (int) ($row->{$scoreField} ?: 0),
            'hits' => (int) ($row->{$hitsField} ?: 0),
            'gold' => (int) ($row->{$goldField} ?: 0),
            'xnine' => (int) ($row->{$xnineField} ?: 0),
            'arrowString' => trim((string) ($row->{$arrowField} ?: ''))
        );
    }

    return array(
        'id' => (int) $row->EnId,
        'license' => $row->EnCode ?: '',
        'lastName' => $row->EnName ?: '',
        'firstName' => $row->EnFirstName ?: '',
        'category' => trim(($row->EnClass ?: '') . ($row->EnDivision ?: '')),
        'clubCode' => $row->CoCode ?: '',
        'clubName' => $row->CoName ?: '',
        'target' => $row->Target ?: '',
        'totalScore' => (int) ($row->QuScore ?: 0),
        'totalHits' => (int) ($row->QuHits ?: 0),
        'totalGold' => (int) ($row->QuGold ?: 0),
        'totalXnine' => (int) ($row->QuXnine ?: 0),
        'tieBreak' => $row->QuTieBreak ?: '',
        'quConfirm' => $quConfirm,
        'globalConfirmed' => (($quConfirm & 1) !== 0),
        'distances' => $distances
    );
}
