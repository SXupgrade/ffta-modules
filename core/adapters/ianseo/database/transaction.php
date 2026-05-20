<?php
require_once(__DIR__ . '/query.php');

function ffta_transaction(callable $callback) {
    if (function_exists('safe_w_BeginTransaction')) {
        safe_w_BeginTransaction();
    } else {
        ffta_write('START TRANSACTION');
    }

    try {
        $result = $callback();
        if (function_exists('safe_w_Commit')) {
            safe_w_Commit();
        } else {
            ffta_write('COMMIT');
        }
        return $result;
    } catch (Exception $error) {
        if (function_exists('safe_w_Rollback')) {
            safe_w_Rollback();
        } else {
            ffta_write('ROLLBACK');
        }
        throw $error;
    }
}
