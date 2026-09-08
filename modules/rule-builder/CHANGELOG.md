# rule-builder module Changelog

## Unreleased

- Fix: `api/rule-builder.php` no longer lets a fatal error from Ianseo's
  own DB helpers (`Common/Fun_DB.inc.php`'s `safe_error()`, which prints
  an HTML fragment and calls `exit()` directly on a read-connection
  failure -- bypassing this endpoint's own `try/catch`) leak an HTML body
  behind the endpoint's `Content-Type: application/json` header. Reported
  symptom: the screen showed `Unexpected token '<' ... is not valid JSON`
  and a direct call to `rule-builder.php?action=status` returned Ianseo's
  raw `[[TecError]@[en]@[Common]]` / "Read Server not reachable" HTML.
  The endpoint now buffers its output and, in a shutdown handler, replaces
  any non-JSON body with a real `{"ok":false,"error":...}` response --
  and, since Ianseo's own message hides the actual `mysqli` failure behind
  a fixed string, re-probes the read DB connection directly
  (`mysqli_connect_error()`, 3s timeout) to surface the real reason (wrong
  host, bad credentials, connection refused, etc.) instead of the opaque
  wrapped message.
- Follow-up: on a real deployment this first pass came back with
  `"The Ianseo core reported a fatal error before this endpoint could
  respond with JSON."` -- the DB probe above found the read connection
  reachable, proving the DB was never the actual cause here. Two more
  fixes:
  - `catch (Exception $error)` widened to `catch (Throwable $error)`. A
    PHP `Error` (`TypeError`, `ArgumentCountError`, `Error`, ...) does
    **not** extend `Exception`, so it fell straight through the
    try/catch to a raw, undecorated PHP fatal instead of this module's
    JSON error shape -- this is the most likely actual cause of the
    reported bug, given nothing about the module's DB-access pattern
    differs from the already-working `gdpr` module's.
  - The shutdown-handler fallback now includes `error_get_last()`
    (message/file/line) when the DB probe finds the connection fine,
    for the remaining case a `Throwable` still can't catch -- a
    compile-time fatal (e.g. a parse error in a required file), which
    terminates the script outside any try/catch entirely. Verified
    against both a real uncaught `Throwable` and a real parse error in
    a required file: both now come back as valid, specific JSON instead
    of a blank body or a fatal-error page.
- **Root cause found and fixed** (in `core/adapters/ianseo/database/
  bootstrap.php`, shared by every module -- see that repo's root
  `CHANGELOG.md` for the full writeup): the diagnostics above surfaced
  `Attempt to read property "LANGUAGE_PATH" on null in
  Common/Globals.inc.php:834`, later `Attempt to assign property
  "ROOT_DIR" on null in config.php:74` in a from-scratch reproduction --
  `$CFG` was null in Ianseo core functions that do `global $CFG;`
  themselves, despite `RuleBuilderExportService`'s constructor having
  just loaded it. Fixed by declaring the Ianseo runtime globals before
  `require_once`-ing Ianseo's `config.php` in the shared bootstrap
  adapter. Reproduced against a real scratch Ianseo install + MariaDB
  before and after the fix (`php -S` + a real DB), confirmed this
  endpoint reaches and successfully queries the database end to end.

## 0.1.0

- Initial version: exports the current tournament's live configured
  ruleset (divisions, classes, events, distances, target faces, sessions)
  as a JSON file, in the exact shape compet+'s own
  `scripts/rules/generate-fr-ianseo-sets.js` produces from its static
  `Custom/sets/FR/*` templates. See README for the shape contract and the
  documented departures from a hand-authored template (omitted
  `ToSubRule`, as-is `ClAgeFrom`/`ClAgeTo` with no shift reversal, SubClass
  merged into `Classes.items`).
- Verified: `php -l`/`node --check` on all files, a 31-check self-test
  (`tests/ruleBuilderExportService.selftest.php`) against a stubbed
  repository, and the i18n coverage test. **Not** verified against a real
  Ianseo/MySQL instance (none available in this environment) -- see
  README "Verification" before relying on this for a real event.
