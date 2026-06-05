<?php
/**
 * Validates and persists league settings.
 */
function league_action_save_settings(IanseoLeagueRepository $repository, array $payload) {
    $settings = league_normalize_settings_payload($payload);

    if (count($settings['roundTournamentCodes']) > 8) {
        return array(
            'ok'    => false,
            'error' => 'A maximum of 8 round tournaments can be configured.'
        );
    }

    $repository->saveSettings($settings);
    return array('ok' => true, 'settings' => $repository->getSettings());
}

function league_normalize_settings_payload(array $payload) {
    $out = array();

    if (isset($payload['masterTournamentCode'])) {
        $out['masterTournamentCode'] = league_clean_tournament_code($payload['masterTournamentCode']);
    }

    if (isset($payload['roundTournamentCodes'])) {
        $codes = $payload['roundTournamentCodes'];
        if (is_string($codes)) {
            $codes = preg_split('/[\r\n,;]+/', $codes);
        }
        if (!is_array($codes)) {
            $codes = array();
        }
        $out['roundTournamentCodes'] = array_values(array_unique(array_filter(array_map(
            'league_clean_tournament_code',
            $codes
        ))));
    }

    foreach (array('groupBy', 'matchPointsMode', 'pointsMode') as $key) {
        if (isset($payload[$key]) && is_string($payload[$key])) {
            $out[$key] = trim($payload[$key]);
        }
    }

    if (isset($payload['matchWinPoints'])) {
        $out['matchWinPoints'] = max(0, (int) $payload['matchWinPoints']);
    }

    if (isset($payload['qualificationPointsGrid'])) {
        $out['qualificationPointsGrid'] = league_normalize_points_grid($payload['qualificationPointsGrid']);
    }

    if (isset($payload['bracketPointsGrid'])) {
        $out['bracketPointsGrid'] = league_normalize_points_grid($payload['bracketPointsGrid']);
    }

    if (isset($payload['categoryPointSettings'])) {
        $out['categoryPointSettings'] = league_normalize_category_point_settings($payload['categoryPointSettings']);
    }

    return $out;
}

function league_clean_tournament_code($value) {
    return substr(trim((string) $value), 0, 8);
}

function league_normalize_points_grid($grid) {
    if (is_string($grid)) {
        $decoded = json_decode($grid, true);
        $grid = is_array($decoded) ? $decoded : array();
    }
    if (!is_array($grid)) {
        return array();
    }

    $out = array();
    foreach ($grid as $row) {
        if (!is_array($row)) {
            continue;
        }
        $rank = isset($row['rank']) ? (int) $row['rank'] : 0;
        if ($rank <= 0) {
            continue;
        }
        $out[] = array(
            'rank' => $rank,
            'points' => isset($row['points']) ? (int) $row['points'] : 0
        );
    }

    usort($out, function ($a, $b) {
        return $a['rank'] - $b['rank'];
    });

    return $out;
}


function league_normalize_category_point_settings($settings) {
    if (is_string($settings)) {
        $decoded = json_decode($settings, true);
        $settings = is_array($decoded) ? $decoded : array();
    }
    if (!is_array($settings)) {
        return array();
    }

    $out = array();
    foreach ($settings as $categoryKey => $categorySettings) {
        $key = strtoupper(trim((string) $categoryKey));
        if ($key === '' || !is_array($categorySettings)) {
            continue;
        }
        $out[$key] = array(
            'enableQualificationPoints' => !empty($categorySettings['enableQualificationPoints']),
            'enableMatchWinPoints'      => !empty($categorySettings['enableMatchWinPoints']),
            'enableBracketPoints'       => !empty($categorySettings['enableBracketPoints']),
            'qualificationPointsGrid'   => isset($categorySettings['qualificationPointsGrid'])
                ? league_normalize_points_grid($categorySettings['qualificationPointsGrid'])
                : array(),
            'matchWinPoints'            => isset($categorySettings['matchWinPoints'])
                ? max(0, (int) $categorySettings['matchWinPoints'])
                : 0,
            'bracketPointsGrid'         => isset($categorySettings['bracketPointsGrid'])
                ? league_normalize_points_grid($categorySettings['bracketPointsGrid'])
                : array()
        );
    }

    ksort($out);
    return $out;
}
