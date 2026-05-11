<?php
require_once(__DIR__ . '/query.php');

/**
 * Execute a callback inside a database transaction.
 *
 * Uses Ianseo's write connection for START TRANSACTION / COMMIT / ROLLBACK.
 *
 * @param callable $callback
 * @return mixed  return value of $callback
 * @throws Exception  re-throws after rolling back
 */
function ffta_transaction(callable $callback) {
    ffta_write('START TRANSACTION');
    try {
        $result = $callback();
        ffta_write('COMMIT');
        return $result;
    } catch (Exception $error) {
        ffta_write('ROLLBACK');
        throw $error;
    }
}
