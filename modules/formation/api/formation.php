<?php
header('Content-Type: application/json; charset=utf-8');
require_once(__DIR__ . '/../../../core/adapters/ianseo/database/query.php');
require_once(__DIR__ . '/../../../core/adapters/ianseo/settings/ModulesParametersAdapter.php');

function formation_tour_id() { return isset($_SESSION['TourId']) ? (int) $_SESSION['TourId'] : 0; }
function formation_payload() { $payload = json_decode(file_get_contents('php://input'), true); return is_array($payload) ? $payload : array(); }
function formation_response($data) { echo json_encode(array('ok' => true, 'data' => $data)); exit; }
function formation_error($message, $status = 500) { http_response_code($status); echo json_encode(array('ok' => false, 'error' => $message)); exit; }

function formation_row($sql) { return ffta_fetch_one(ffta_query($sql)); }
function formation_count($sql) { $row = formation_row($sql); return $row ? (int) $row->cnt : 0; }

function formation_snapshot() {
    $tourId = formation_tour_id();
    $settings = new ModulesParametersAdapter('ffta-formation', $tourId);
    $progress = $settings->get('progress');
    if (!is_array($progress)) $progress = array();

    $tournament = $tourId ? formation_row('SELECT ToId, ToCode, ToName, ToWhere, ToVenue, ToWhenFrom, ToWhenTo, ToType, ToTypeName, ToTypeSubRule, ToLocRule, ToNumSession, ToIocCode FROM Tournament WHERE ToId=' . $tourId . ' LIMIT 1') : null;
    $entries = $tourId ? formation_count('SELECT COUNT(*) cnt FROM Entries WHERE EnTournament=' . $tourId) : 0;
    $sessions = $tourId ? formation_count('SELECT COUNT(*) cnt FROM Session WHERE SesTournament=' . $tourId) : 0;
    $assigned = $tourId ? formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND COALESCE(q.QuTargetNo,'')<>''") : 0;
    $scores = $tourId ? formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND q.QuScore>0") : 0;
    $firstEntry = $tourId ? formation_row('SELECT EnFirstName, EnName, EnCode FROM Entries WHERE EnTournament=' . $tourId . ' ORDER BY EnName, EnFirstName LIMIT 1') : null;

    return array(
        'tourId' => $tourId,
        'tournament' => $tournament ? array(
            'id' => (int) $tournament->ToId,
            'code' => $tournament->ToCode,
            'name' => $tournament->ToName ?: ($tournament->ToWhere ?: $tournament->ToCode),
            'where' => $tournament->ToWhere,
            'venue' => $tournament->ToVenue,
            'from' => $tournament->ToWhenFrom,
            'to' => $tournament->ToWhenTo,
            'rule' => $tournament->ToLocRule,
            'type' => $tournament->ToTypeName,
            'subRule' => $tournament->ToTypeSubRule,
            'sessions' => (int) $tournament->ToNumSession,
            'ioc' => $tournament->ToIocCode
        ) : null,
        'stats' => array('entries' => $entries, 'sessions' => $sessions, 'assigned' => $assigned, 'scores' => $scores),
        'sample' => array('archer' => $firstEntry ? trim($firstEntry->EnFirstName . ' ' . $firstEntry->EnName) : ''),
        'progress' => $progress
    );
}

function formation_validate($lessonId, $validators) {
    $results = array();
    $completed = true;
    foreach ($validators as $validator) {
        $check = formation_run_validator($validator);
        $results[] = $check;
        if (!$check['ok']) $completed = false;
    }
    $settings = new ModulesParametersAdapter('ffta-formation', formation_tour_id());
    $progress = $settings->get('progress');
    if (!is_array($progress)) $progress = array();
    $progress[$lessonId] = array('completed' => $completed, 'checkedAt' => gmdate('c'), 'results' => $results);
    $settings->set('progress', $progress);
    return array('completed' => $completed, 'results' => $results, 'progress' => $progress, 'snapshot' => formation_snapshot());
}

function formation_run_validator($validator) {
    $tourId = formation_tour_id();
    if ($validator === 'active_tournament') return array('id' => $validator, 'ok' => $tourId > 0, 'message' => $tourId > 0 ? 'Active tournament detected.' : 'Open or create a tournament first.');
    if ($tourId <= 0) return array('id' => $validator, 'ok' => false, 'message' => 'No active tournament.');
    $t = formation_row('SELECT * FROM Tournament WHERE ToId=' . $tourId . ' LIMIT 1');
    if ($validator === 'tournament_identity') return array('id' => $validator, 'ok' => $t && $t->ToCode && ($t->ToName || $t->ToWhere) && $t->ToWhenFrom, 'message' => 'Tournament code, name/place and dates are required.');
    if ($validator === 'french_rule') return array('id' => $validator, 'ok' => $t && stripos((string) $t->ToLocRule, 'FR') !== false, 'message' => 'Use French rules in competition information.');
    if ($validator === 'indoor_two_distances') return array('id' => $validator, 'ok' => $t && (stripos((string) $t->ToTypeName, '18') !== false || (int) $t->ToNumDist === 2), 'message' => 'Expected an indoor 18m / 2 distances setup.');
    if ($validator === 'sessions_configured') return array('id' => $validator, 'ok' => formation_count("SELECT COUNT(*) cnt FROM Session WHERE SesTournament={$tourId} AND SesTar4Session>0 AND SesAth4Target>0") > 0, 'message' => 'At least one session must define targets and archers per target.');
    if ($validator === 'divisions_classes') return array('id' => $validator, 'ok' => formation_count("SELECT COUNT(*) cnt FROM Divisions WHERE DivTournament={$tourId}") > 0 && formation_count("SELECT COUNT(*) cnt FROM Classes WHERE ClTournament={$tourId}") > 0, 'message' => 'Divisions and classes must exist.');
    if ($validator === 'distances_configured') return array('id' => $validator, 'ok' => formation_count("SELECT COUNT(*) cnt FROM TournamentDistances WHERE TdTournament={$tourId}") > 0 || formation_count("SELECT COUNT(*) cnt FROM DistanceInformation WHERE DiTournament={$tourId}") > 0, 'message' => 'Distances must be generated or configured.');
    if ($validator === 'officials_optional') return array('id' => $validator, 'ok' => true, 'message' => 'Optional in V1: the trainer can validate orally.');
    if ($validator === 'participants_created') return array('id' => $validator, 'ok' => formation_count("SELECT COUNT(*) cnt FROM Entries WHERE EnTournament={$tourId}") >= 2, 'message' => 'Create at least two participants.');
    if ($validator === 'targets_assigned') return array('id' => $validator, 'ok' => formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND COALESCE(q.QuTargetNo,'')<>''") >= 1, 'message' => 'Assign at least one archer to a target.');
    if ($validator === 'scores_entered') return array('id' => $validator, 'ok' => formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND q.QuScore>0") >= 1, 'message' => 'Enter at least one score.');
    if ($validator === 'ranking_ready') return array('id' => $validator, 'ok' => formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND q.QuScore>0 AND q.QuClRank>0") >= 1, 'message' => 'Ranking should be recalculated after score entry.');
    if ($validator === 'txt_export_ready') return array('id' => $validator, 'ok' => formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND q.QuScore>0") >= 1, 'message' => 'TXT export is possible once scores exist.');
    return array('id' => $validator, 'ok' => false, 'message' => 'Unknown validator.');
}

try {
    $action = isset($_GET['action']) ? $_GET['action'] : 'snapshot';
    $payload = formation_payload();
    if ($action === 'snapshot') formation_response(formation_snapshot());
    if ($action === 'validateLesson') formation_response(formation_validate($payload['lessonId'] ?? '', $payload['validators'] ?? array()));
    if ($action === 'resetProgress') { (new ModulesParametersAdapter('ffta-formation', formation_tour_id()))->set('progress', array()); formation_response(array('snapshot' => formation_snapshot())); }
    formation_error('Unknown action.', 400);
} catch (Exception $error) { formation_error($error->getMessage()); }
