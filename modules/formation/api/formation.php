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
function formation_scripts() {
    $file = __DIR__ . '/../data/formation.scripts.json';
    if (!file_exists($file)) formation_error('Formation script registry not found.', 500);
    $scripts = json_decode(file_get_contents($file), true);
    if (!is_array($scripts)) formation_error('Formation script registry is invalid JSON.', 500);
    return $scripts;
}
function formation_result($id, $status, $message) {
    return array('id' => $id, 'status' => $status, 'ok' => $status === 'ok', 'message' => $message);
}
function formation_script_response($results, $extra = array()) {
    $status = 'ok';
    foreach ($results as $result) {
        if (($result['status'] ?? '') === 'ko') { $status = 'ko'; break; }
        if (($result['status'] ?? '') === 'warning' && $status === 'ok') $status = 'warning';
    }
    return array_merge(array(
        'status' => $status,
        'completed' => $status === 'ok',
        'results' => $results,
        'messages' => array_map(function ($result) { return $result['message']; }, $results),
        'snapshot' => formation_snapshot()
    ), $extra);
}
function formation_table_columns($table) {
    $rows = ffta_fetch_all(ffta_query('SHOW COLUMNS FROM ' . $table));
    $columns = array();
    foreach ($rows as $row) $columns[$row->Field] = true;
    return $columns;
}
function formation_insert_dynamic($table, $values) {
    $columns = formation_table_columns($table);
    $insert = array();
    foreach ($values as $column => $value) {
        if (isset($columns[$column])) $insert[$column] = $value;
    }
    if (empty($insert)) return false;
    $names = implode(',', array_keys($insert));
    $sqlValues = array_map(function ($value) {
        if ($value === null) return 'NULL';
        if (is_int($value) || is_float($value)) return (string) $value;
        return ffta_sql_string($value);
    }, array_values($insert));
    ffta_write('INSERT INTO ' . $table . ' (' . $names . ') VALUES (' . implode(',', $sqlValues) . ')');
    return true;
}
function formation_update_dynamic($table, $values, $where) {
    $columns = formation_table_columns($table);
    $sets = array();
    foreach ($values as $column => $value) {
        if (!isset($columns[$column])) continue;
        if ($value === null) $sets[] = $column . '=NULL';
        elseif (is_int($value) || is_float($value)) $sets[] = $column . '=' . $value;
        else $sets[] = $column . '=' . ffta_sql_string($value);
    }
    if (empty($sets)) return false;
    ffta_write('UPDATE ' . $table . ' SET ' . implode(',', $sets) . ' WHERE ' . $where);
    return true;
}
function formation_allowed_columns($table) {
    $map = array(
        'Tournament' => array('ToCode', 'ToName', 'ToWhere', 'ToVenue', 'ToWhenFrom', 'ToWhenTo', 'ToLocRule', 'ToTypeName', 'ToTypeSubRule', 'ToType', 'ToNumDist', 'ToNumSession', 'ToIocCode'),
        'Session' => array('SesTournament', 'SesOrder', 'SesName', 'SesTar4Session', 'SesAth4Target'),
        'Countries' => array('CoTournament', 'CoId', 'CoCode', 'CoName', 'CoNameComplete', 'CoIocCode'),
        'Entries' => array('EnTournament', 'EnCode', 'EnFirstName', 'EnName', 'EnCountry', 'EnCountry2', 'EnDivision', 'EnClass', 'EnAgeClass', 'EnIocCode', 'EnDob', 'EnSex', 'EnStatus', 'EnTargetFace'),
        'Qualifications' => array('QuId', 'QuSession', 'QuTargetNo', 'QuTarget', 'QuLetter', 'QuScore', 'QuGold', 'QuXnine', 'QuClRank'),
        'Divisions' => array('DivTournament', 'DivId', 'DivDescription', 'DivViewOrder'),
        'Classes' => array('ClTournament', 'ClId', 'ClDescription', 'ClViewOrder'),
        'TournamentDistances' => array('TdTournament', 'TdDistance', 'TdSequence'),
        'DistanceInformation' => array('DiTournament')
    );
    return $map[$table] ?? array();
}
function formation_table_tournament_column($table) {
    $map = array(
        'Tournament' => 'ToId',
        'Countries' => 'CoTournament',
        'Session' => 'SesTournament',
        'Entries' => 'EnTournament',
        'Divisions' => 'DivTournament',
        'Classes' => 'ClTournament',
        'TournamentDistances' => 'TdTournament',
        'DistanceInformation' => 'DiTournament'
    );
    return $map[$table] ?? '';
}
function formation_sql_field($field, $defaultTable) {
    $parts = explode('.', $field);
    $table = count($parts) === 2 ? $parts[0] : $defaultTable;
    $column = count($parts) === 2 ? $parts[1] : $field;
    if (!in_array($column, formation_allowed_columns($table), true)) return '';
    return $table . '.' . $column;
}
function formation_compare($actual, $operator, $expected) {
    if ($operator === '===') return (int) $actual === (int) $expected;
    if ($operator === '==') return (string) $actual == (string) $expected;
    if ($operator === '>=') return $actual >= $expected;
    if ($operator === '<=') return $actual <= $expected;
    if ($operator === '>') return $actual > $expected;
    if ($operator === '<') return $actual < $expected;
    if ($operator === '!=') return $actual != $expected;
    return false;
}
function formation_filter_values($table, $values, $tourId = null) {
    $allowed = array_flip(formation_allowed_columns($table));
    $filtered = array();
    foreach ($values as $column => $value) {
        if (isset($allowed[$column])) $filtered[$column] = formation_resolve_value($value, $tourId);
    }
    return $filtered;
}
function formation_resolve_value($value, $tourId = null) {
    if ($value === '{today}') return date('Y-m-d');
    if (is_array($value) && isset($value['ref'])) return formation_resolve_ref($value['ref'], $tourId);
    return $value;
}
function formation_resolve_ref($ref, $tourId) {
    if (!$tourId) return '';
    if (strpos((string) $ref, 'country:') === 0) {
        $code = substr((string) $ref, strlen('country:'));
        $row = formation_row("SELECT CoId FROM Countries WHERE CoTournament={$tourId} AND CoCode=" . ffta_sql_string($code) . ' LIMIT 1');
        return $row ? (int) $row->CoId : '';
    }
    return '';
}
function formation_where_from_match($match, $scope) {
    $parts = array();
    foreach ($scope as $column => $value) $parts[] = $column . '=' . (is_int($value) ? $value : ffta_sql_string($value));
    foreach ($match as $column => $value) $parts[] = $column . '=' . (is_int($value) ? $value : ffta_sql_string(formation_resolve_value($value)));
    return implode(' AND ', $parts);
}
function formation_upsert_dynamic($table, $match, $values, $scope) {
    $tourId = 0;
    foreach ($scope as $column => $value) {
        if (substr($column, -10) === 'Tournament' || $column === 'CoTournament') $tourId = (int) $value;
    }
    $values = formation_filter_values($table, array_merge($scope, $values), $tourId);
    $where = formation_where_from_match($match, $scope);
    $exists = formation_count('SELECT COUNT(*) cnt FROM ' . $table . ' WHERE ' . $where) > 0;
    if ($exists) {
        formation_update_dynamic($table, $values, $where);
        return 'updated';
    }
    formation_insert_dynamic($table, $values);
    return 'inserted';
}

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

function formation_validate($lessonId, $scriptId) {
    $checkResult = $scriptId ? formation_run_check_script($scriptId) : formation_script_response(array(formation_result('manual_validation', 'ok', 'No automatic check configured for this step.')));
    $results = $checkResult['results'];
    $completed = $checkResult['completed'];
    $settings = new ModulesParametersAdapter('ffta-formation', formation_tour_id());
    $progress = $settings->get('progress');
    if (!is_array($progress)) $progress = array();
    $progress[$lessonId] = array('completed' => $completed, 'checkedAt' => gmdate('c'), 'results' => $results);
    $settings->set('progress', $progress);
    return array('completed' => $completed, 'results' => $results, 'progress' => $progress, 'snapshot' => formation_snapshot());
}

function formation_check($validators) {
    $results = array();
    foreach ($validators as $validator) {
        $results[] = formation_run_validator($validator);
    }
    return formation_script_response($results);
}

function formation_run_init_script($lessonId, $scriptId) {
    $tourId = formation_tour_id();
    if ($tourId <= 0) formation_error('Open or create a tournament before preparing a training case.', 400);
    $scripts = formation_scripts();
    $script = $scripts['initScripts'][$scriptId] ?? null;
    if (!$script) formation_error('Unknown initialization script.', 400);
    $results = formation_execute_init_script($scriptId, $tourId);
    $response = formation_script_response($results);
    $settings = new ModulesParametersAdapter('ffta-formation', $tourId);
    $progress = $settings->get('progress');
    if (!is_array($progress)) $progress = array();
    $progress[$lessonId . ':init'] = array('scriptId' => $scriptId, 'status' => $response['status'], 'checkedAt' => gmdate('c'), 'results' => $results);
    $settings->set('progress', $progress);
    $response['progress'] = $progress;
    $response['snapshot'] = formation_snapshot();
    return $response;
}

function formation_execute_init_script($scriptId, $tourId) {
    $scripts = formation_scripts();
    $script = $scripts['initScripts'][$scriptId] ?? null;
    if (!$script) return array(formation_result('runInitScript:' . $scriptId, 'ko', 'Unknown initialization script.'));
    $results = array();
    foreach (($script['actions'] ?? array()) as $action) {
        $results[] = formation_run_init_action($action, $tourId);
    }
    return $results;
}

function formation_run_init_action($action, $tourId) {
    $type = is_array($action) ? ($action['type'] ?? '') : (string) $action;
    if ($type === 'runInitScript') {
        $nestedResults = formation_execute_init_script($action['scriptId'] ?? '', $tourId);
        $nested = formation_script_response($nestedResults);
        return formation_result('runInitScript:' . ($action['scriptId'] ?? ''), $nested['status'], 'Nested initialization script ' . ($action['scriptId'] ?? '') . ' executed.');
    }
    if ($type === 'updateTournament') {
        $values = formation_filter_values('Tournament', $action['values'] ?? array());
        formation_update_dynamic('Tournament', $values, 'ToId=' . $tourId);
        return formation_result($type, 'ok', 'Tournament information updated.');
    }
    if ($type === 'upsertSession') {
        $state = formation_upsert_dynamic('Session', $action['match'] ?? array(), $action['values'] ?? array(), array('SesTournament' => $tourId));
        return formation_result($type, 'ok', 'Session information ' . $state . '.');
    }
    if ($type === 'upsertCountry') {
        return formation_upsert_country_action($action, $tourId);
    }
    if ($type === 'upsertEntry') {
        $state = formation_upsert_dynamic('Entries', $action['match'] ?? array(), $action['values'] ?? array(), array('EnTournament' => $tourId));
        return formation_result($type, 'ok', 'Archer entry ' . $state . '.');
    }
    if ($type === 'upsertQualification') {
        return formation_upsert_qualification_action($action, $tourId);
    }
    if ($type === 'upsertDivision') {
        $state = formation_upsert_dynamic('Divisions', $action['match'] ?? array(), $action['values'] ?? array(), array('DivTournament' => $tourId));
        return formation_result($type, 'ok', 'Division information ' . $state . '.');
    }
    if ($type === 'upsertClass') {
        $state = formation_upsert_dynamic('Classes', $action['match'] ?? array(), $action['values'] ?? array(), array('ClTournament' => $tourId));
        return formation_result($type, 'ok', 'Class information ' . $state . '.');
    }
    if ($type === 'upsertTournamentDistance') {
        $state = formation_upsert_dynamic('TournamentDistances', $action['match'] ?? array(), $action['values'] ?? array(), array('TdTournament' => $tourId));
        return formation_result($type, 'ok', 'Tournament distance ' . $state . '.');
    }
    return formation_result($type ?: 'unknown', 'ko', 'Unknown initialization action.');
}

function formation_upsert_country_action($action, $tourId) {
    $match = $action['match'] ?? array();
    $values = $action['values'] ?? array();
    if (!isset($match['CoCode']) && isset($values['CoCode'])) $match['CoCode'] = $values['CoCode'];
    if (!isset($match['CoCode'])) return formation_result('upsertCountry', 'ko', 'Country/club code is required.');
    $existing = formation_row("SELECT CoId FROM Countries WHERE CoTournament={$tourId} AND CoCode=" . ffta_sql_string($match['CoCode']) . ' LIMIT 1');
    if (!$existing) {
        $max = formation_row("SELECT MAX(CoId) maxId FROM Countries WHERE CoTournament={$tourId}");
        $values['CoId'] = ((int) ($max ? $max->maxId : 0)) + 1;
    }
    $state = formation_upsert_dynamic('Countries', $match, $values, array('CoTournament' => $tourId));
    return formation_result('upsertCountry', 'ok', 'Country/club ' . $match['CoCode'] . ' ' . $state . '.');
}

function formation_upsert_qualification_action($action, $tourId) {
    $entryCode = $action['entryCode'] ?? '';
    $entry = formation_row("SELECT EnId FROM Entries WHERE EnTournament={$tourId} AND EnCode=" . ffta_sql_string($entryCode) . ' LIMIT 1');
    if (!$entry) return formation_result('upsertQualification', 'ko', 'Entry ' . $entryCode . ' was not found.');
    $entryId = (int) $entry->EnId;
    $exists = formation_count('SELECT COUNT(*) cnt FROM Qualifications WHERE QuId=' . $entryId) > 0;
    $values = formation_filter_values('Qualifications', array_merge(array('QuId' => $entryId), $action['values'] ?? array()));
    if ($exists) {
        formation_update_dynamic('Qualifications', $values, 'QuId=' . $entryId);
        return formation_result('upsertQualification', 'ok', 'Qualification updated for entry ' . $entryCode . '.');
    }
    formation_insert_dynamic('Qualifications', $values);
    return formation_result('upsertQualification', 'ok', 'Qualification inserted for entry ' . $entryCode . '.');
}

function formation_run_check_script($scriptId) {
    $scripts = formation_scripts();
    $script = $scripts['checkScripts'][$scriptId] ?? null;
    if (!$script) formation_error('Unknown verification script.', 400);
    if (isset($script['checks']) && is_array($script['checks'])) {
        $results = array();
        foreach ($script['checks'] as $index => $check) {
            $results[] = formation_run_check($check, $scriptId . ':' . $index);
        }
        return formation_script_response($results);
    }
    return formation_check($script['validators'] ?? array());
}

function formation_run_check($check, $id) {
    $type = $check['type'] ?? '';
    if ($type === 'activeTournament') {
        $ok = formation_tour_id() > 0;
        return formation_result($id, $ok ? 'ok' : 'ko', $check['message'] ?? ($ok ? 'Active tournament detected.' : 'Open or create a tournament first.'));
    }
    if (formation_tour_id() <= 0) return formation_result($id, 'ko', 'No active tournament.');
    if ($type === 'or') {
        $children = array();
        foreach (($check['checks'] ?? array()) as $index => $child) {
            $children[] = formation_run_check($child, $id . '.' . $index);
        }
        foreach ($children as $childResult) {
            if (($childResult['status'] ?? '') === 'ok') return formation_result($id, 'ok', $check['message'] ?? 'At least one condition matched.');
        }
        return formation_result($id, 'ko', $check['message'] ?? 'No condition matched.');
    }
    if ($type === 'fieldNotEmpty') return formation_run_field_check($check, $id, 'notEmpty');
    if ($type === 'fieldContains') return formation_run_field_check($check, $id, 'contains');
    if ($type === 'fieldEquals') return formation_run_field_check($check, $id, 'equals');
    if ($type === 'count') return formation_run_count_check($check, $id);
    return formation_result($id, 'ko', 'Unknown check type.');
}

function formation_run_field_check($check, $id, $mode) {
    $table = $check['from'] ?? '';
    $field = $check['field'] ?? '';
    $sqlField = formation_sql_field($field, $table);
    if (!$sqlField) return formation_result($id, 'ko', 'Invalid check field.');
    $where = formation_scope_where($table);
    $row = formation_row('SELECT ' . $sqlField . ' value FROM ' . $table . ' WHERE ' . $where . ' LIMIT 1');
    $value = $row ? (string) $row->value : '';
    if ($mode === 'notEmpty') $ok = trim($value) !== '';
    elseif ($mode === 'contains') $ok = stripos($value, (string) ($check['value'] ?? '')) !== false;
    else $ok = (string) $value === (string) ($check['value'] ?? '');
    return formation_result($id, $ok ? 'ok' : 'ko', $check['message'] ?? 'Field check failed.');
}

function formation_run_count_check($check, $id) {
    $table = $check['from'] ?? '';
    if (!formation_allowed_columns($table)) return formation_result($id, 'ko', 'Invalid check table.');
    $sql = 'SELECT COUNT(*) cnt FROM ' . $table;
    if (($check['join'] ?? '') === 'Entries' && $table === 'Qualifications') {
        $sql .= ' INNER JOIN Entries ON Entries.EnId=Qualifications.QuId';
    }
    $where = formation_scope_where($table, $check['join'] ?? '');
    foreach (formation_where_conditions($check['where'] ?? array(), $table) as $condition) $where .= ' AND ' . $condition;
    $actual = formation_count($sql . ' WHERE ' . $where);
    $expected = $check['expected'] ?? 0;
    $operator = $check['operator'] ?? '>=';
    return formation_result($id, formation_compare($actual, $operator, $expected) ? 'ok' : 'ko', $check['message'] ?? ('Expected count ' . $operator . ' ' . $expected . ', got ' . $actual . '.'));
}

function formation_scope_where($table, $join = '') {
    $tourId = formation_tour_id();
    if ($table === 'Tournament') return 'Tournament.ToId=' . $tourId;
    if ($table === 'Qualifications' && $join === 'Entries') return 'Entries.EnTournament=' . $tourId;
    $tourColumn = formation_table_tournament_column($table);
    if ($tourColumn) return $table . '.' . $tourColumn . '=' . $tourId;
    return '1=1';
}

function formation_where_conditions($where, $defaultTable) {
    $conditions = array();
    foreach ($where as $field => $rule) {
        $sqlField = formation_sql_field($field, $defaultTable);
        if (!$sqlField) continue;
        if (is_array($rule)) {
            $operator = $rule['operator'] ?? '=';
            $value = formation_resolve_value($rule['value'] ?? '');
        } else {
            $operator = '=';
            $value = formation_resolve_value($rule);
        }
        if (!in_array($operator, array('=', '!=', '>', '<', '>=', '<='), true)) continue;
        $conditions[] = $sqlField . $operator . (is_int($value) || is_float($value) ? $value : ffta_sql_string($value));
    }
    return $conditions;
}

function formation_seed_sessions($tourId) {
    if (formation_count("SELECT COUNT(*) cnt FROM Session WHERE SesTournament={$tourId}") > 0) return;
    formation_insert_dynamic('Session', array('SesTournament' => $tourId, 'SesOrder' => 1, 'SesName' => 'FFTA-FORM Depart 1', 'SesTar4Session' => 12, 'SesAth4Target' => 4));
    formation_insert_dynamic('Session', array('SesTournament' => $tourId, 'SesOrder' => 2, 'SesName' => 'FFTA-FORM Depart 2', 'SesTar4Session' => 12, 'SesAth4Target' => 4));
    formation_update_dynamic('Tournament', array('ToNumSession' => 2), 'ToId=' . $tourId);
}

function formation_seed_taxonomy($tourId) {
    if (formation_count("SELECT COUNT(*) cnt FROM Divisions WHERE DivTournament={$tourId} AND DivId='CL'") === 0) {
        formation_insert_dynamic('Divisions', array('DivTournament' => $tourId, 'DivId' => 'CL', 'DivDescription' => 'Recurve', 'DivViewOrder' => 1));
    }
    if (formation_count("SELECT COUNT(*) cnt FROM Classes WHERE ClTournament={$tourId} AND ClId='S1'") === 0) {
        formation_insert_dynamic('Classes', array('ClTournament' => $tourId, 'ClId' => 'S1', 'ClDescription' => 'Senior 1', 'ClViewOrder' => 1));
    }
    if (formation_count("SELECT COUNT(*) cnt FROM TournamentDistances WHERE TdTournament={$tourId}") === 0) {
        formation_insert_dynamic('TournamentDistances', array('TdTournament' => $tourId, 'TdDistance' => 18, 'TdSequence' => 1));
        formation_insert_dynamic('TournamentDistances', array('TdTournament' => $tourId, 'TdDistance' => 18, 'TdSequence' => 2));
    }
}

function formation_seed_participants($tourId, $wrongTarget) {
    formation_seed_sessions($tourId);
    formation_seed_taxonomy($tourId);
    $archers = array(
        array('code' => 'FFTA-FORM-001', 'first' => 'Camille', 'last' => 'Martin', 'target' => $wrongTarget ? '001A' : '002A'),
        array('code' => 'FFTA-FORM-002', 'first' => 'Noa', 'last' => 'Bernard', 'target' => '002B')
    );
    foreach ($archers as $archer) {
        $entry = formation_row("SELECT EnId FROM Entries WHERE EnTournament={$tourId} AND EnCode=" . ffta_sql_string($archer['code']) . ' LIMIT 1');
        if (!$entry) {
            formation_insert_dynamic('Entries', array(
                'EnTournament' => $tourId,
                'EnCode' => $archer['code'],
                'EnFirstName' => $archer['first'],
                'EnName' => $archer['last'],
                'EnCountry' => 'FFTA',
                'EnCountry2' => 'FORM',
                'EnDivision' => 'CL',
                'EnClass' => 'S1',
                'EnStatus' => 1
            ));
            $entry = formation_row("SELECT EnId FROM Entries WHERE EnTournament={$tourId} AND EnCode=" . ffta_sql_string($archer['code']) . ' LIMIT 1');
        }
        if ($entry && formation_count('SELECT COUNT(*) cnt FROM Qualifications WHERE QuId=' . (int) $entry->EnId) === 0) {
            formation_insert_dynamic('Qualifications', array('QuId' => (int) $entry->EnId, 'QuSession' => 1, 'QuTargetNo' => $archer['target'], 'QuScore' => 0, 'QuClRank' => 0));
        } elseif ($entry) {
            formation_update_dynamic('Qualifications', array('QuSession' => 1, 'QuTargetNo' => $archer['target']), 'QuId=' . (int) $entry->EnId);
        }
    }
}

function formation_seed_scores($tourId) {
    $rows = ffta_fetch_all(ffta_query("SELECT e.EnId, e.EnCode FROM Entries e WHERE e.EnTournament={$tourId} AND e.EnCode LIKE 'FFTA-FORM-%'"));
    $rank = 1;
    foreach ($rows as $row) {
        formation_update_dynamic('Qualifications', array('QuScore' => $rank === 1 ? 542 : 511, 'QuGold' => $rank === 1 ? 18 : 11, 'QuXnine' => $rank === 1 ? 7 : 3, 'QuClRank' => $rank), 'QuId=' . (int) $row->EnId);
        $rank++;
    }
}

function formation_run_validator($validator) {
    $tourId = formation_tour_id();
    if ($validator === 'active_tournament') return formation_result($validator, $tourId > 0 ? 'ok' : 'ko', $tourId > 0 ? 'Active tournament detected.' : 'Open or create a tournament first.');
    if ($tourId <= 0) return formation_result($validator, 'ko', 'No active tournament.');
    $t = formation_row('SELECT * FROM Tournament WHERE ToId=' . $tourId . ' LIMIT 1');
    if ($validator === 'tournament_identity') return formation_result($validator, $t && $t->ToCode && ($t->ToName || $t->ToWhere) && $t->ToWhenFrom ? 'ok' : 'ko', 'Tournament code, name/place and dates are required.');
    if ($validator === 'french_rule') return formation_result($validator, $t && stripos((string) $t->ToLocRule, 'FR') !== false ? 'ok' : 'ko', 'Use French rules in competition information.');
    if ($validator === 'indoor_two_distances') return formation_result($validator, $t && (stripos((string) $t->ToTypeName, '18') !== false || (int) $t->ToNumDist === 2) ? 'ok' : 'ko', 'Expected an indoor 18m / 2 distances setup.');
    if ($validator === 'sessions_configured') return formation_result($validator, formation_count("SELECT COUNT(*) cnt FROM Session WHERE SesTournament={$tourId} AND SesTar4Session>0 AND SesAth4Target>0") > 0 ? 'ok' : 'ko', 'At least one session must define targets and archers per target.');
    if ($validator === 'divisions_classes') return formation_result($validator, formation_count("SELECT COUNT(*) cnt FROM Divisions WHERE DivTournament={$tourId}") > 0 && formation_count("SELECT COUNT(*) cnt FROM Classes WHERE ClTournament={$tourId}") > 0 ? 'ok' : 'ko', 'Divisions and classes must exist.');
    if ($validator === 'distances_configured') return formation_result($validator, formation_count("SELECT COUNT(*) cnt FROM TournamentDistances WHERE TdTournament={$tourId}") > 0 || formation_count("SELECT COUNT(*) cnt FROM DistanceInformation WHERE DiTournament={$tourId}") > 0 ? 'ok' : 'ko', 'Distances must be generated or configured.');
    if ($validator === 'officials_optional') return formation_result($validator, 'warning', 'Optional in V1: the trainer can validate orally.');
    if ($validator === 'participants_created') return formation_result($validator, formation_count("SELECT COUNT(*) cnt FROM Entries WHERE EnTournament={$tourId}") >= 2 ? 'ok' : 'ko', 'Create at least two participants.');
    if ($validator === 'targets_assigned') return formation_result($validator, formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND COALESCE(q.QuTargetNo,'')<>''") >= 1 ? 'ok' : 'ko', 'Assign at least one archer to a target.');
    if ($validator === 'target_case_fixed') return formation_result($validator, formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND e.EnCode='FFTA-FORM-001' AND q.QuTargetNo='002A'") === 1 ? 'ok' : 'ko', 'Camille Martin must be moved back to target 002A.');
    if ($validator === 'scores_entered') return formation_result($validator, formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND q.QuScore>0") >= 1 ? 'ok' : 'ko', 'Enter at least one score.');
    if ($validator === 'ranking_ready') return formation_result($validator, formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND q.QuScore>0 AND q.QuClRank>0") >= 1 ? 'ok' : 'ko', 'Ranking should be recalculated after score entry.');
    if ($validator === 'txt_export_ready') return formation_result($validator, formation_count("SELECT COUNT(*) cnt FROM Qualifications q INNER JOIN Entries e ON e.EnId=q.QuId WHERE e.EnTournament={$tourId} AND q.QuScore>0") >= 1 ? 'ok' : 'ko', 'TXT export is possible once scores exist.');
    return formation_result($validator, 'ko', 'Unknown validator.');
}

try {
    $action = isset($_GET['action']) ? $_GET['action'] : 'snapshot';
    $payload = formation_payload();
    if ($action === 'snapshot') formation_response(formation_snapshot());
    if ($action === 'runCheckScript') formation_response(formation_run_check_script($payload['scriptId'] ?? ''));
    if ($action === 'validateLesson') formation_response(formation_validate($payload['lessonId'] ?? '', $payload['scriptId'] ?? ''));
    if ($action === 'runInitScript') formation_response(formation_run_init_script($payload['lessonId'] ?? '', $payload['scriptId'] ?? ''));
    if ($action === 'resetProgress') { (new ModulesParametersAdapter('ffta-formation', formation_tour_id()))->set('progress', array()); formation_response(array('snapshot' => formation_snapshot())); }
    formation_error('Unknown action.', 400);
} catch (Exception $error) { formation_error($error->getMessage()); }
