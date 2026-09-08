<?php
/**
 * Ianseo bootstrap adapter.
 *
 * Install path:
 *   Modules/Custom/ffta-modules
 *
 * This file must reuse the host Ianseo runtime: configuration, include path,
 * session, language helpers, ACL helpers and database helpers. It must never
 * ask for host/user/password and must never create a second DB configuration.
 */
if (defined('FFTA_IANSEO_BOOTSTRAPPED')) {
    return;
}

$rootConfig = dirname(dirname(dirname(dirname(dirname(dirname(dirname(__FILE__))))))) . '/config.php';

if (!file_exists($rootConfig)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array(
        'ok' => false,
        'error' => 'Unable to locate Ianseo config.php. Install ffta-modules at Modules/Custom/ffta-modules.'
    ));
    exit;
}

/**
 * require_once() runs the required file's top-level code in whatever
 * scope THIS line executes in. This file is itself require_once'd from
 * repositories/services whose own require chain can start inside a class
 * method (e.g. a service constructor that lazily loads its repository,
 * so unit tests can stub it without touching a real Ianseo install --
 * see RuleBuilderExportService's constructor) -- a function scope, not
 * the true global scope PHP request handling normally runs in.
 *
 * Ianseo's own config.php assigns $CFG/$INFO/etc as plain top-level
 * variables, assuming (like every native Ianseo page) it always runs at
 * global scope. Without declaring them global here first, those
 * assignments silently land in whatever local/method scope this require
 * chain happened to start from and vanish the moment that method
 * returns -- leaving every Ianseo core function that does `global $CFG;`
 * itself (SelectLanguage(), safe_r_con(), CheckTourSession(), ...) seeing
 * $CFG as null for the rest of the request. Symptom seen in production:
 * "Attempt to read/assign property ... on null" fatals deep in
 * Common/Globals.inc.php / config.php, and safe_r_con() reporting "Read
 * Server not reachable" because mysqli_connect() got null host/user/pass.
 *
 * global $x; makes $x a true reference to $GLOBALS['x'], so a later plain
 * "$x = ...;" (a full reassignment, not just a mutation) still correctly
 * writes through to the global -- these declarations make the whole
 * require chain below behave as if it always ran at global scope,
 * regardless of which module's constructor triggered it.
 */
global $CFG, $INFO, $WRIT_CON, $READ_CON, $ERROR_REPORT;

require_once($rootConfig);
define('FFTA_IANSEO_BOOTSTRAPPED', true);
