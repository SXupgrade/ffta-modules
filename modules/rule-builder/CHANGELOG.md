# rule-builder module Changelog

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
