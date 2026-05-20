<?php
require_once(__DIR__ . '/bootstrap.php');

/**
 * Thin wrappers around Ianseo database helpers.
 *
 * Ianseo exposes the DB configuration and connections through config.php and
 * Common/Fun_DB.inc.php. We intentionally use those helpers instead of opening
 * our own mysqli/PDO connection.
 */

function ffta_query($sql) {
    if (function_exists('safe_r_sql')) {
        return safe_r_sql($sql);
    }
    if (function_exists('safe_r_SQL')) {
        return safe_r_SQL($sql);
    }
    throw new RuntimeException('[ffta] Ianseo read helper safe_r_sql was not found.');
}

function ffta_write($sql) {
    if (function_exists('safe_w_sql')) {
        return safe_w_sql($sql);
    }
    if (function_exists('safe_w_SQL')) {
        return safe_w_SQL($sql);
    }
    throw new RuntimeException('[ffta] Ianseo write helper safe_w_sql was not found.');
}

function ffta_fetch_all($result) {
    $rows = array();
    if (!$result) {
        return $rows;
    }
    while ($row = safe_fetch($result)) {
        $rows[] = $row;
    }
    return $rows;
}

function ffta_fetch_one($result) {
    if (!$result) {
        return null;
    }
    $row = safe_fetch($result);
    return $row ?: null;
}

/**
 * Escape a value without adding quotes.
 *
 * Important: Ianseo StrSafe_DB() returns a quoted value by default. Passing
 * true as the second argument returns only the escaped raw value. This wrapper
 * deliberately returns an unquoted value so callers can build either quoted
 * string literals or numeric expressions explicitly.
 */
function ffta_escape($value) {
    if (function_exists('StrSafe_DB')) {
        return StrSafe_DB((string) $value, true);
    }
    return addslashes((string) $value);
}

function ffta_sql_string($value) {
    if (function_exists('StrSafe_DB')) {
        return StrSafe_DB($value);
    }
    return "'" . addslashes((string) $value) . "'";
}

function ffta_in_list(array $values) {
    if (empty($values)) {
        return "''";
    }
    return implode(',', array_map(function ($v) {
        return ffta_sql_string($v);
    }, $values));
}
