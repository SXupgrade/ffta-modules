<?php
/**
 * Check Scorecard data access, exposed through the shared api/data.php dispatcher.
 * Migrated from modules/check-scorecard/api/check-scorecard.php (now removed) so the
 * module has no PHP file of its own, matching the other JS-only modules.
 */

function ffta_check_scorecard_context($tourId) {
    $row = ffta_fetch_one(ffta_query("SELECT ToId, ToCode, ToName, ToNumDist, ToNumEnds, ToMaxDistScore FROM Tournament WHERE ToId=" . (int) $tourId . " LIMIT 1"));
    if (!$row) {
        return null;
    }
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

function ffta_check_scorecard_sessions($tourId) {
    $rows = ffta_fetch_all(ffta_query("SELECT SesOrder, SesName, SesTar4Session, SesFirstTarget FROM Session WHERE SesTournament=" . (int) $tourId . " AND SesType='Q' ORDER BY SesOrder"));
    return array_map(function ($row) {
        $first = (int) ($row->SesFirstTarget ?: 1);
        $count = (int) ($row->SesTar4Session ?: 0);
        $last = $count > 0 ? $first + $count - 1 : $first;
        $label = trim(($row->SesOrder ?: '') . ' - ' . ($row->SesName ?: 'Qualification'));
        return array('id' => (int) $row->SesOrder, 'label' => $label, 'firstTarget' => $first, 'lastTarget' => $last);
    }, $rows);
}

function ffta_check_scorecard_build_score_select($numDistances) {
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

function ffta_check_scorecard_map_row($row, $numDistances) {
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

function ffta_check_scorecard_rows($tourId, array $payload) {
    $context = ffta_check_scorecard_context($tourId);
    $numDistances = $context ? $context['numDistances'] : 0;
    $session = max(1, (int) ($payload['session'] ?? 1));
    $select = ffta_check_scorecard_build_score_select($numDistances);

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

    return array_map(function ($row) use ($numDistances) {
        return ffta_check_scorecard_map_row($row, $numDistances);
    }, ffta_fetch_all(ffta_query($sql)));
}

function ffta_check_scorecard_get_row($tourId, $id, $numDistances) {
    $select = ffta_check_scorecard_build_score_select($numDistances);
    $row = ffta_fetch_one(ffta_query("SELECT EnId, EnCode, EnName, EnFirstName, EnClass, EnDivision, CoCode, CoName,
            CONCAT(QuTarget, QuLetter) AS Target,
            QuScore, QuHits, QuGold, QuXnine, QuTieBreak, QuConfirm" . $select . "
        FROM Entries
        INNER JOIN Qualifications ON QuId=EnId
        LEFT JOIN Countries ON CoId=EnCountry
        WHERE EnTournament=" . (int) $tourId . " AND EnId=" . (int) $id . " LIMIT 1"));
    if (!$row) {
        throw new RuntimeException('Archer not found.');
    }
    return ffta_check_scorecard_map_row($row, $numDistances);
}

function ffta_check_scorecard_set_confirm($tourId, array $payload) {
    $context = ffta_check_scorecard_context($tourId);
    $numDistances = $context ? $context['numDistances'] : 0;
    $id = (int) ($payload['id'] ?? 0);
    $distance = (int) ($payload['distance'] ?? 0);
    $confirmed = !empty($payload['confirmed']);

    if ($id <= 0) {
        throw new RuntimeException('Invalid archer id.');
    }
    if ($distance < 0 || $distance > $numDistances) {
        throw new RuntimeException('Invalid QuConfirm bit.');
    }

    $exists = ffta_fetch_one(ffta_query("SELECT EnId FROM Entries INNER JOIN Qualifications ON QuId=EnId WHERE EnTournament=" . (int) $tourId . " AND EnId=" . (int) $id . " LIMIT 1"));
    if (!$exists) {
        throw new RuntimeException('Archer not found in this tournament.');
    }

    $bit = (int) pow(2, $distance);
    if ($confirmed) {
        ffta_write("UPDATE Qualifications SET QuConfirm=QuConfirm | " . (int) $bit . " WHERE QuId=" . (int) $id);
    } else {
        ffta_write("UPDATE Qualifications SET QuConfirm=QuConfirm - IF((QuConfirm & " . (int) $bit . ") != 0, " . (int) $bit . ", 0) WHERE QuId=" . (int) $id);
    }

    return ffta_check_scorecard_get_row($tourId, $id, $numDistances);
}
