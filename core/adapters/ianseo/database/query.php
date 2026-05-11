<?php
require_once(__DIR__ . '/bootstrap.php');

/**
 * Thin wrappers around the Ianseo database helpers.
 *
 * Ianseo provides two sets of connection helpers:
 *   - safe_r_SQL / safe_w_SQL   — execute read / write queries
 *   - safe_fetch                — fetch result row as object
 *   - safe_fetch_assoc          — fetch result row as associative array
 *   - safe_num_rows             — row count
 *   - StrSafe_DB                — escape a string for safe SQL inclusion
 *
 * These helpers are loaded globally by Ianseo's config/bootstrap.
 * We never call mysqli/PDO directly and never request credentials.
 *
 * TODO(ianseo-verified): Verify helper names against your installed version.
 * Some builds use safe_r_sql (lowercase) instead of safe_r_SQL.
 */

/**
 * Execute a read query and return the raw Ianseo result resource.
 *
 * @param string $sql
 * @return mixed  Ianseo result resource or false
 */
function ffta_query($sql) {
    if (function_exists('safe_r_SQL')) {
        return safe_r_SQL($sql);
    }
    // TODO(ianseo-verified): Some versions expose a lowercase alias.
    if (function_exists('safe_r_sql')) {
        return safe_r_sql($sql);
    }
    throw new RuntimeException('[ffta] safe_r_SQL not found. Ianseo bootstrap may not have loaded.');
}

/**
 * Execute a write query (INSERT/UPDATE/DELETE/REPLACE).
 *
 * @param string $sql
 * @return mixed  Ianseo result or false
 */
function ffta_write($sql) {
    if (function_exists('safe_w_SQL')) {
        return safe_w_SQL($sql);
    }
    if (function_exists('safe_w_sql')) {
        return safe_w_sql($sql);
    }
    throw new RuntimeException('[ffta] safe_w_SQL not found. Ianseo bootstrap may not have loaded.');
}

/**
 * Fetch all rows from a result resource as objects.
 *
 * @param mixed $result  Ianseo result resource
 * @return object[]
 */
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

/**
 * Fetch the first row from a result resource, or null.
 *
 * @param mixed $result  Ianseo result resource
 * @return object|null
 */
function ffta_fetch_one($result) {
    if (!$result) {
        return null;
    }
    $row = safe_fetch($result);
    return $row ?: null;
}

/**
 * Escape a value for safe inclusion in SQL.
 * Wraps Ianseo's StrSafe_DB helper.
 *
 * @param string $value
 * @return string  escaped string (NOT quoted — you must add quotes in SQL)
 */
function ffta_escape($value) {
    if (function_exists('StrSafe_DB')) {
        return StrSafe_DB((string) $value);
    }
    // Fallback: addslashes is weaker but prevents blank exceptions during dev.
    return addslashes((string) $value);
}

/**
 * Build a safe IN(...) clause for a list of string values.
 *
 * @param string[] $values
 * @return string  e.g. "'A','B','C'"
 */
function ffta_in_list(array $values) {
    if (empty($values)) {
        return "''";
    }
    return implode(',', array_map(function ($v) {
        return "'" . ffta_escape($v) . "'";
    }, $values));
}
