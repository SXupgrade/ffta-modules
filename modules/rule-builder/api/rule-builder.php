<?php
/**
 * Rule-builder module API.
 * Actions:
 *   - status: identify the current tournament (name, type, dates) for the screen.
 *   - download: build and download the ruleset JSON for the current tournament.
 */
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . '/../../../core/adapters/ianseo/acl/acl.php');
require_once(__DIR__ . '/../application/RuleBuilderExportService.php');

/**
 * Ianseo's own DB helpers (Common/Fun_DB.inc.php's safe_error()) print a raw
 * HTML fragment and call exit() directly on a read-connection failure --
 * that bypasses the try/catch below entirely, so the client is left with
 * this endpoint's "Content-Type: application/json" header in front of an
 * HTML body, which breaks JSON.parse() on the client with a confusing
 * "Unexpected token '<'". Buffer the whole response so a shutdown handler
 * can replace a non-JSON body with a real JSON error before it reaches the
 * client, whatever caused it to bail out.
 */
ob_start();
register_shutdown_function(function () {
    $buffered = ob_get_clean();
    $trimmed = ltrim((string) $buffered);
    if ($trimmed !== '' && $trimmed[0] !== '{' && $trimmed[0] !== '[') {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        $dbError = ffta_rule_builder_probe_read_db();
        if ($dbError !== null) {
            $message = 'Database read connection failed: ' . $dbError;
        } else {
            // The DB is reachable right now, so whatever bailed out wasn't
            // safe_r_con() -- most likely a PHP Error (TypeError and
            // friends aren't Exception subclasses, so the try/catch below
            // never saw it) or a raw fatal from a require_once. PHP tracks
            // the terminating error even past exit()/a fatal, so surface it
            // instead of a guess.
            $lastError = error_get_last();
            $message = $lastError
                ? sprintf('%s in %s:%d', $lastError['message'], $lastError['file'], $lastError['line'])
                : 'The Ianseo core reported a fatal error before this endpoint could respond with JSON.';
        }
        echo json_encode(array('ok' => false, 'error' => $message));
        return;
    }
    echo $buffered;
});

/**
 * Re-checks the read DB connection directly, independently of Ianseo's own
 * safe_r_con() (which swallows the real mysqli error behind the fixed
 * string "Read Server not reachable"). Returns the real
 * mysqli_connect_error() text, or null if $CFG isn't populated (nothing to
 * probe) or a fresh connection actually succeeds (the earlier failure was
 * transient, or came from something other than the DB).
 */
function ffta_rule_builder_probe_read_db() {
    global $CFG;
    if (empty($CFG) || empty($CFG->R_HOST)) {
        return null;
    }
    // MYSQLI_REPORT_OFF + a short connect timeout: this already-degraded
    // request must not also hang for the platform's default TCP timeout
    // (tens of seconds) or throw past this best-effort probe.
    mysqli_report(MYSQLI_REPORT_OFF);
    $probe = mysqli_init();
    mysqli_options($probe, MYSQLI_OPT_CONNECT_TIMEOUT, 3);
    $connected = @mysqli_real_connect($probe, $CFG->R_HOST, $CFG->R_USER, $CFG->R_PASS);
    if ($connected) {
        mysqli_close($probe);
        return null;
    }
    return mysqli_connect_error();
}

$access = array(
    'acl' => 'AclModules',
    'subFeature' => 'ruleBuilder',
    'read' => 'AclReadOnly',
    'write' => 'AclReadWrite',
);

try {
    if (function_exists('CheckTourSession')) {
        CheckTourSession(true);
    }
    ffta_acl_require($access, 'read');

    $service = new RuleBuilderExportService();
    $action = isset($_GET['action']) ? trim($_GET['action']) : '';

    switch ($action) {
        case 'status':
            echo json_encode(array('ok' => true, 'data' => $service->getStatus()));
            break;

        case 'download':
            $status = $service->getStatus();
            $ruleset = $service->buildForTournament($status['tournamentId']);
            $filename = 'rule-builder-' . preg_replace('/[^A-Za-z0-9_-]/', '_', $status['typeSubRule'] ?: 'export')
                . '-' . $status['tournamentId'] . '.json';

            $content = json_encode($ruleset, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
            header('Content-Type: application/json; charset=utf-8');
            header('Content-Disposition: attachment; filename=' . $filename);
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . strlen($content));
            echo $content;
            break;

        default:
            http_response_code(400);
            echo json_encode(array('ok' => false, 'error' => "Unknown action: {$action}"));
    }
} catch (Throwable $error) {
    // Throwable, not Exception: a PHP Error (TypeError, ArgumentCountError,
    // Error, ...) doesn't extend Exception, so catching only Exception here
    // let those fall through uncaught -- straight to a raw, undecorated PHP
    // fatal-error body instead of this module's own JSON error shape (the
    // shutdown handler above still catches that case too, but with only
    // error_get_last() to go on instead of this Throwable's real message,
    // file, and line).
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(array('ok' => false, 'error' => sprintf(
        '%s in %s:%d',
        $error->getMessage(),
        $error->getFile(),
        $error->getLine()
    )));
}
