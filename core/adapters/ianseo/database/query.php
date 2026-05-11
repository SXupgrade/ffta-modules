<?php
require_once(__DIR__ . '/bootstrap.php');

/**
 * Execute a query using the host Ianseo database connection.
 *
 * TODO for agent:
 * - Replace with Ianseo-native DB helpers after inspecting public sources.
 * - Add parameter binding support according to available Ianseo helpers.
 */
function ffta_db_query($sql, $params = array()) {
    if (!empty($params)) {
        throw new Exception('Parameterized queries are not implemented yet.');
    }

    if (function_exists('safe_r_sql')) {
        return safe_r_sql($sql);
    }

    if (function_exists('safe_w_sql')) {
        return safe_w_sql($sql);
    }

    throw new Exception('No supported Ianseo SQL helper found.');
}

function ffta_db_fetch_all($result) {
    $rows = array();
    if (!$result) {
        return $rows;
    }
    while ($row = safe_fetch($result)) {
        $rows[] = $row;
    }
    return $rows;
}
