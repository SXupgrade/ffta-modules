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
