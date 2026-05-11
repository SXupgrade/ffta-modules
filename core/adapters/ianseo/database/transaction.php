<?php
require_once(__DIR__ . '/query.php');

function ffta_db_transaction($callback) {
    ffta_db_query('START TRANSACTION');
    try {
        $result = $callback();
        ffta_db_query('COMMIT');
        return $result;
    } catch (Exception $error) {
        ffta_db_query('ROLLBACK');
        throw $error;
    }
}
