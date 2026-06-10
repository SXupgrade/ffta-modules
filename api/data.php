<?php
/**
 * Small common data API for simple modules.
 * It intentionally starts narrow: tournament context, entries, qualification scores and targets.
 */
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . '/../core/adapters/ianseo/database/query.php');
require_once(__DIR__ . '/../core/adapters/ianseo/acl/acl.php');

$DATA_ACCESS = array(
    'acl' => 'AclCompetition',
    'subFeature' => 'cQualifications',
    'read' => 'AclReadOnly',
    'write' => 'AclReadWrite'
);

function ffta_data_current_tour_id() {
    return isset($_SESSION['TourId']) ? (int) $_SESSION['TourId'] : 0;
}

function ffta_data_payload() {
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : array();
}

function ffta_sql_quote($value) {
    return "'" . str_replace("'", "''", (string) $value) . "'";
}

function ffta_data_response($data) {
    echo json_encode(array('ok' => true, 'data' => $data));
    exit;
}

function ffta_data_get_tournament($tourId) {
    $row = ffta_fetch_one(ffta_query("SELECT ToId, ToCode, ToWhere, ToVenue FROM Tournament WHERE ToId=" . (int) $tourId . " LIMIT 1"));
    if (!$row) {
        return null;
    }
    return array(
        'id' => (int) $row->ToId,
        'code' => $row->ToCode,
        'name' => $row->ToWhere ?? $row->ToVenue ?? $row->ToCode,
        'where' => $row->ToWhere ?? '',
        'venue' => $row->ToVenue ?? ''
    );
}

function ffta_data_list_entries($tourId, array $payload) {
    $sessionFilter = isset($payload['session']) && $payload['session'] !== '' ? ' AND q.QuSession=' . (int) $payload['session'] : '';
    $entryFilter = isset($payload['entryId']) && $payload['entryId'] !== '' ? ' AND e.EnId=' . (int) $payload['entryId'] : '';
    $sql = "SELECT e.EnId, e.EnCode, e.EnFirstName, e.EnName, e.EnCountry, e.EnDivision, e.EnClass, q.QuSession, q.QuTargetNo
            FROM Entries e
            LEFT JOIN Qualifications q ON q.QuId=e.EnId
            WHERE e.EnTournament=" . (int) $tourId . $sessionFilter . $entryFilter . "
            ORDER BY e.EnName, e.EnFirstName, q.QuSession";
    $rows = ffta_fetch_all(ffta_query($sql));
    return array_map(function ($row) {
        return array(
            'entryId' => (int) $row->EnId,
            'code' => $row->EnCode,
            'firstName' => $row->EnFirstName,
            'lastName' => $row->EnName,
            'country' => $row->EnCountry,
            'division' => $row->EnDivision,
            'class' => $row->EnClass,
            'session' => isset($row->QuSession) ? (int) $row->QuSession : null,
            'targetNo' => $row->QuTargetNo ?? ''
        );
    }, $rows);
}

function ffta_data_read_scores($tourId, array $payload) {
    $sessionFilter = isset($payload['session']) && $payload['session'] !== '' ? ' AND q.QuSession=' . (int) $payload['session'] : '';
    $entryFilter = isset($payload['entryId']) && $payload['entryId'] !== '' ? ' AND e.EnId=' . (int) $payload['entryId'] : '';
    $sql = "SELECT e.EnId, e.EnCode, e.EnFirstName, e.EnName, e.EnDivision, e.EnClass,
                   q.QuId, q.QuSession, q.QuTargetNo, q.QuD1Score, q.QuD2Score, q.QuD3Score, q.QuD4Score,
                   q.QuD5Score, q.QuD6Score, q.QuD7Score, q.QuD8Score, q.QuScore, q.QuClRank
            FROM Entries e
            INNER JOIN Qualifications q ON q.QuId=e.EnId
            WHERE e.EnTournament=" . (int) $tourId . $sessionFilter . $entryFilter . "
            ORDER BY q.QuSession, q.QuTargetNo, e.EnName, e.EnFirstName";
    $rows = ffta_fetch_all(ffta_query($sql));
    return array_map(function ($row) {
        $distances = array();
        for ($index = 1; $index <= 8; $index++) {
            $field = 'QuD' . $index . 'Score';
            $distances['D' . $index] = isset($row->$field) ? (int) $row->$field : 0;
        }
        return array(
            'entryId' => (int) $row->EnId,
            'qualificationId' => (int) $row->QuId,
            'session' => (int) $row->QuSession,
            'targetNo' => $row->QuTargetNo,
            'code' => $row->EnCode,
            'firstName' => $row->EnFirstName,
            'lastName' => $row->EnName,
            'division' => $row->EnDivision,
            'class' => $row->EnClass,
            'distances' => $distances,
            'total' => (int) $row->QuScore,
            'rank' => isset($row->QuClRank) ? (int) $row->QuClRank : null
        );
    }, $rows);
}

function ffta_data_write_score($tourId, array $payload) {
    $quId = isset($payload['qualificationId']) ? (int) $payload['qualificationId'] : (isset($payload['quId']) ? (int) $payload['quId'] : 0);
    $distance = isset($payload['distance']) ? strtoupper(trim((string) $payload['distance'])) : '';
    $score = isset($payload['score']) ? (int) $payload['score'] : 0;

    if ($quId <= 0 || !preg_match('/^D[1-8]$/', $distance)) {
        throw new RuntimeException('Invalid score payload. Expected qualificationId, distance D1-D8 and score.');
    }
    if ($score < 0) {
        throw new RuntimeException('Score cannot be negative.');
    }

    $distanceIndex = (int) substr($distance, 1);
    $field = 'QuD' . $distanceIndex . 'Score';

    $exists = ffta_fetch_one(ffta_query("SELECT q.QuId FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE q.QuId={$quId} AND e.EnTournament=" . (int) $tourId . " LIMIT 1"));
    if (!$exists) {
        throw new RuntimeException('Qualification row not found for active tournament.');
    }

    ffta_write("UPDATE Qualifications SET {$field}={$score}, QuScore=(QuD1Score+QuD2Score+QuD3Score+QuD4Score+QuD5Score+QuD6Score+QuD7Score+QuD8Score) WHERE QuId={$quId}");
    return array('qualificationId' => $quId, 'distance' => $distance, 'score' => $score);
}


function ffta_data_recalculate_ranking($tourId, array $payload) {
    $sessionFilter = isset($payload['session']) && $payload['session'] !== '' ? ' AND q.QuSession=' . (int) $payload['session'] : '';
    $sql = "SELECT q.QuId, q.QuSession, e.EnDivision, e.EnClass, q.QuScore
            FROM Qualifications q
            INNER JOIN Entries e ON e.EnId=q.QuId
            WHERE e.EnTournament=" . (int) $tourId . $sessionFilter . "
            ORDER BY q.QuSession, e.EnDivision, e.EnClass, q.QuScore DESC, q.QuId";
    $rows = ffta_fetch_all(ffta_query($sql));
    $rankByGroup = array();
    $updated = array();

    foreach ($rows as $row) {
        $group = ((int) $row->QuSession) . '|' . $row->EnDivision . '|' . $row->EnClass;
        if (!isset($rankByGroup[$group])) {
            $rankByGroup[$group] = 1;
        }
        $rank = $rankByGroup[$group]++;
        $quId = (int) $row->QuId;
        ffta_write("UPDATE Qualifications SET QuClRank={$rank} WHERE QuId={$quId}");
        $updated[] = array('qualificationId' => $quId, 'rank' => $rank);
    }

    return array('updated' => count($updated), 'rows' => $updated);
}

function ffta_data_get_entry($tourId, array $payload) {
    $entryId = isset($payload['entryId']) ? (int) $payload['entryId'] : 0;
    if ($entryId <= 0) {
        throw new RuntimeException('Missing entryId.');
    }
    $rows = ffta_data_list_entries($tourId, array('entryId' => $entryId));
    if (!count($rows)) {
        throw new RuntimeException('Entry not found.');
    }
    return $rows[0];
}

function ffta_data_get_score($tourId, array $payload) {
    $entryId = isset($payload['entryId']) ? (int) $payload['entryId'] : (isset($payload['quId']) ? (int) $payload['quId'] : 0);
    if ($entryId <= 0) {
        throw new RuntimeException('Missing entryId.');
    }
    $rows = ffta_data_read_scores($tourId, array('entryId' => $entryId));
    if (!count($rows)) {
        throw new RuntimeException('Qualification score not found.');
    }
    return $rows[0];
}

function ffta_data_list_clubs($tourId) {
    $sql = "SELECT e.EnCountry AS clubCode, c.CoName AS clubName
            FROM Entries e
            LEFT JOIN Countries c ON c.CoId=e.EnCountry AND c.CoTournament=e.EnTournament
            WHERE e.EnTournament=" . (int) $tourId . "
            GROUP BY e.EnCountry, c.CoName
            ORDER BY c.CoName, e.EnCountry";
    $rows = ffta_fetch_all(ffta_query($sql));
    return array_map(function ($row) {
        return array('clubCode' => $row->clubCode, 'clubName' => $row->clubName ?? $row->clubCode);
    }, $rows);
}

function ffta_data_list_divisions($tourId) {
    $rows = ffta_fetch_all(ffta_query("SELECT DivId, DivDescription FROM Divisions WHERE DivTournament=" . (int) $tourId . " ORDER BY DivViewOrder, DivId"));
    return array_map(function ($row) {
        return array('code' => $row->DivId, 'label' => $row->DivDescription ?? $row->DivId);
    }, $rows);
}

function ffta_data_list_classes($tourId) {
    $rows = ffta_fetch_all(ffta_query("SELECT ClId, ClDescription FROM Classes WHERE ClTournament=" . (int) $tourId . " ORDER BY ClViewOrder, ClId"));
    return array_map(function ($row) {
        return array('code' => $row->ClId, 'label' => $row->ClDescription ?? $row->ClId);
    }, $rows);
}

function ffta_data_assign_target($tourId, array $payload) {
    $entryId = isset($payload['entryId']) ? (int) $payload['entryId'] : 0;
    $session = isset($payload['session']) ? (int) $payload['session'] : 0;
    $targetNo = isset($payload['targetNo']) ? trim((string) $payload['targetNo']) : (isset($payload['target']) ? trim((string) $payload['target']) : '');
    if ($entryId <= 0 || $session <= 0 || $targetNo === '') {
        throw new RuntimeException('assignTarget expects entryId, session and targetNo.');
    }
    $safeTargetNo = ffta_sql_quote($targetNo);
    $exists = ffta_fetch_one(ffta_query("SELECT q.QuId FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE q.QuId={$entryId} AND e.EnTournament=" . (int) $tourId . " LIMIT 1"));
    if (!$exists) {
        throw new RuntimeException('Qualification row not found for active tournament.');
    }
    ffta_write("UPDATE Qualifications SET QuSession={$session}, QuTargetNo={$safeTargetNo} WHERE QuId={$entryId}");
    return array('entryId' => $entryId, 'session' => $session, 'targetNo' => $targetNo);
}

function ffta_data_unassign_target($tourId, array $payload) {
    $entryId = isset($payload['entryId']) ? (int) $payload['entryId'] : 0;
    if ($entryId <= 0) {
        throw new RuntimeException('unassignTarget expects entryId.');
    }
    ffta_write("UPDATE Qualifications SET QuTargetNo='' WHERE QuId={$entryId}");
    return array('entryId' => $entryId, 'targetNo' => '');
}


function ffta_data_scan_organizer_achievements() {
    $tournamentRows = ffta_fetch_all(ffta_query("SELECT ToId, ToCode, ToName, ToWhenFrom, ToNumSession FROM Tournament ORDER BY ToWhenFrom DESC, ToId DESC"));
    $tournamentCount = count($tournamentRows);
    $tournamentCount2026 = 0;
    $tournamentName = '';
    foreach ($tournamentRows as $index => $row) {
        if ($index === 0) {
            $tournamentName = $row->ToName ?? $row->ToCode ?? '';
        }
        if (strpos((string) ($row->ToWhenFrom ?? ''), '2026') === 0) {
            $tournamentCount2026++;
        }
    }

    $entryStats = ffta_fetch_one(ffta_query("SELECT COUNT(*) AS TotalEntryCount, COALESCE(MAX(EntryCount), 0) AS MaxEntriesInTournament FROM (SELECT EnTournament, COUNT(*) AS EntryCount FROM Entries GROUP BY EnTournament) x"));
    $assignedStats = ffta_fetch_one(ffta_query("SELECT COUNT(*) AS AssignedEntryCount FROM Entries e INNER JOIN Qualifications q ON q.QuId=e.EnId WHERE q.QuTargetNo<>'' AND q.QuTargetNo<>'0' AND q.QuTargetNo<>'000'"));
    $scoreStats = ffta_fetch_one(ffta_query("SELECT COUNT(*) AS ScoredEntryCount, SUM(CASE WHEN q.QuClRank>0 THEN 1 ELSE 0 END) AS RankedEntryCount FROM Entries e INNER JOIN Qualifications q ON q.QuId=e.EnId WHERE q.QuScore>0"));
    $fieldStats = ffta_fetch_one(ffta_query("SELECT COUNT(*) AS CompletedFieldPlanCount FROM (SELECT e.EnTournament, COUNT(*) AS EntryCount, SUM(CASE WHEN q.QuTargetNo<>'' AND q.QuTargetNo<>'0' AND q.QuTargetNo<>'000' THEN 1 ELSE 0 END) AS AssignedCount FROM Entries e LEFT JOIN Qualifications q ON q.QuId=e.EnId GROUP BY e.EnTournament HAVING EntryCount>0 AND EntryCount=AssignedCount) x"));
    $sessionStats = ffta_fetch_one(ffta_query("SELECT COALESCE(MAX(SessionCount), 0) AS MaxSessionCount, SUM(CASE WHEN SessionCount>=2 THEN 1 ELSE 0 END) AS MultiSessionTournamentCount FROM (SELECT e.EnTournament, COUNT(DISTINCT q.QuSession) AS SessionCount FROM Entries e LEFT JOIN Qualifications q ON q.QuId=e.EnId GROUP BY e.EnTournament) x"));
    $divisionStats = ffta_fetch_one(ffta_query("SELECT COALESCE(MAX(DivisionCount), 0) AS MaxDivisionCount FROM (SELECT EnTournament, COUNT(DISTINCT EnDivision) AS DivisionCount FROM Entries WHERE EnDivision<>'' GROUP BY EnTournament) x"));
    $clubStats = ffta_fetch_one(ffta_query("SELECT COALESCE(MAX(ClubCount), 0) AS MaxClubCount FROM (SELECT EnTournament, COUNT(DISTINCT EnCountry) AS ClubCount FROM Entries WHERE EnCountry<>'' GROUP BY EnTournament) x"));
    $targetStats = ffta_fetch_one(ffta_query("SELECT COUNT(*) AS TargetCount FROM (SELECT e.EnTournament, q.QuSession, q.QuTargetNo FROM Entries e INNER JOIN Qualifications q ON q.QuId=e.EnId WHERE q.QuTargetNo<>'' GROUP BY e.EnTournament, q.QuSession, q.QuTargetNo) x"));

    $totalEntryCount = isset($entryStats->TotalEntryCount) ? (int) $entryStats->TotalEntryCount : 0;
    $assignedEntryCount = isset($assignedStats->AssignedEntryCount) ? (int) $assignedStats->AssignedEntryCount : 0;

    return array(
        'scannedAt' => date('c'),
        'scanScope' => 'all',
        'tournamentCount' => $tournamentCount,
        'tournamentCount2026' => $tournamentCount2026,
        'tournamentName' => $tournamentName,
        'totalEntryCount' => $totalEntryCount,
        'entryCount' => $totalEntryCount,
        'maxEntriesInTournament' => isset($entryStats->MaxEntriesInTournament) ? (int) $entryStats->MaxEntriesInTournament : 0,
        'assignedEntryCount' => $assignedEntryCount,
        'scoredEntryCount' => isset($scoreStats->ScoredEntryCount) ? (int) $scoreStats->ScoredEntryCount : 0,
        'rankedEntryCount' => isset($scoreStats->RankedEntryCount) ? (int) $scoreStats->RankedEntryCount : 0,
        'targetCount' => isset($targetStats->TargetCount) ? (int) $targetStats->TargetCount : 0,
        'sessionCount' => isset($sessionStats->MaxSessionCount) ? (int) $sessionStats->MaxSessionCount : 0,
        'maxSessionCount' => isset($sessionStats->MaxSessionCount) ? (int) $sessionStats->MaxSessionCount : 0,
        'multiSessionTournamentCount' => isset($sessionStats->MultiSessionTournamentCount) ? (int) $sessionStats->MultiSessionTournamentCount : 0,
        'divisionCount' => isset($divisionStats->MaxDivisionCount) ? (int) $divisionStats->MaxDivisionCount : 0,
        'maxDivisionCount' => isset($divisionStats->MaxDivisionCount) ? (int) $divisionStats->MaxDivisionCount : 0,
        'maxClubCount' => isset($clubStats->MaxClubCount) ? (int) $clubStats->MaxClubCount : 0,
        'completedFieldPlanCount' => isset($fieldStats->CompletedFieldPlanCount) ? (int) $fieldStats->CompletedFieldPlanCount : 0,
        'fieldCompletionPercent' => $totalEntryCount > 0 ? round(($assignedEntryCount / $totalEntryCount) * 100) : 0
    );
}

function ffta_data_list_targets($tourId, array $payload) {
    $sessionFilter = isset($payload['session']) && $payload['session'] !== '' ? ' AND q.QuSession=' . (int) $payload['session'] : '';
    $sql = "SELECT q.QuSession, q.QuTargetNo, COUNT(*) AS ArcherCount
            FROM Qualifications q
            INNER JOIN Entries e ON e.EnId=q.QuId
            WHERE e.EnTournament=" . (int) $tourId . $sessionFilter . " AND q.QuTargetNo<>''
            GROUP BY q.QuSession, q.QuTargetNo
            ORDER BY q.QuSession, q.QuTargetNo";
    $rows = ffta_fetch_all(ffta_query($sql));
    return array_map(function ($row) {
        return array(
            'session' => (int) $row->QuSession,
            'targetNo' => $row->QuTargetNo,
            'archerCount' => (int) $row->ArcherCount
        );
    }, $rows);
}

try {
    if (function_exists('CheckTourSession')) {
        CheckTourSession(true);
    }

    $action = isset($_GET['action']) ? trim($_GET['action']) : '';
    $payload = ffta_data_payload();
    $tourId = ffta_data_current_tour_id();
    if ($tourId <= 0 && $action !== 'scanOrganizerAchievements') {
        throw new RuntimeException('No active Ianseo tournament found in session.');
    }

    switch ($action) {
        case 'scanOrganizerAchievements':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(ffta_data_scan_organizer_achievements());
            break;
        case 'getCurrentTournament':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(ffta_data_get_tournament($tourId));
            break;
        case 'listEntries':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(ffta_data_list_entries($tourId, $payload));
            break;
        case 'readQualificationScores':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(ffta_data_read_scores($tourId, $payload));
            break;
        case 'writeQualificationScore':
            ffta_acl_require($DATA_ACCESS, 'write');
            ffta_data_response(ffta_data_write_score($tourId, $payload));
            break;
        case 'listTargets':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(ffta_data_list_targets($tourId, $payload));
            break;
        case 'recalculateQualificationRanking':
            ffta_acl_require($DATA_ACCESS, 'write');
            ffta_data_response(ffta_data_recalculate_ranking($tourId, $payload));
            break;
        case 'getCurrentUser':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(array('id' => 0, 'login' => isset($_SESSION['AUTH_USER']) ? $_SESSION['AUTH_USER'] : '', 'name' => isset($_SESSION['AUTH_USER']) ? $_SESSION['AUTH_USER'] : 'Ianseo user'));
            break;
        case 'getEntry':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(ffta_data_get_entry($tourId, $payload));
            break;
        case 'getQualificationScore':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(ffta_data_get_score($tourId, $payload));
            break;
        case 'assignTarget':
            ffta_acl_require($DATA_ACCESS, 'write');
            ffta_data_response(ffta_data_assign_target($tourId, $payload));
            break;
        case 'unassignTarget':
            ffta_acl_require($DATA_ACCESS, 'write');
            ffta_data_response(ffta_data_unassign_target($tourId, $payload));
            break;
        case 'listClubs':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(ffta_data_list_clubs($tourId));
            break;
        case 'listDivisions':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(ffta_data_list_divisions($tourId));
            break;
        case 'listClasses':
            ffta_acl_require($DATA_ACCESS, 'read');
            ffta_data_response(ffta_data_list_classes($tourId));
            break;
        default:
            http_response_code(400);
            echo json_encode(array('ok' => false, 'error' => 'Unknown action: ' . $action));
    }
} catch (Exception $error) {
    http_response_code(500);
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
