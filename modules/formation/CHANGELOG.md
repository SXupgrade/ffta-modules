# Changelog

## Unreleased

- Add 4 knowledge-only lessons based on organizer field feedback: FFTA
  licensed archer database synchronization, individual shoot / individual
  event entry flags, all-results vs. event-ranking printouts, and ISK /
  Scorekeeper lite mode.
- Fix the "Configurer les departs" lesson: `scriptInitExercise` and
  `scriptVerifExercise` now agree between `formation.steps.csv` and the
  embedded `formation.course.js` fallback (both now seed and check 2
  configured sessions; they previously disagreed on init script and
  session count expectations).
- Renumber lesson `stepId`s 1-16 to fit the new lessons into the existing
  narrative order.
- Fix `initScripts.scores`: the second `upsertQualification` action targeted
  a stale entry code (`FFTA-FORM-002`) that no archer ever has, instead of
  Noa Bernard's real code (`1000456Z`). The seed action silently failed
  every time the "Saisie et verification des scores" lesson was
  initialized, so only one of the two training archers ever got a score.
- Fix `checkScripts.target_case_fixed`: it referenced `Qualifications.QuPosition`,
  a column the formation API never whitelists for writes or reads, so the
  condition was silently dropped; the remaining condition compared against
  target `1`, a value the "Affectation des cibles" exercise never asks the
  trainee to produce. The check effectively validated nothing about the
  actual fix. It now checks `QuTarget=2` / `QuLetter=A`, the position
  `wrong_target` actually expects the trainee to restore.
- Remove `formation_seed_sessions`/`formation_seed_taxonomy`/
  `formation_seed_participants`/`formation_seed_scores` and the
  `validators`-list fallback (`formation_check`/`formation_run_validator`)
  from `api/formation.php`: dead code, never called by any action handler,
  built around an `FFTA-FORM-001`/`FFTA-FORM-002` entry-code convention
  that the live `formation.scripts.json` scripts do not use (and that was
  the likely source of the `scores` bug above).
- Turn 5 lessons into real fix-it exercises instead of "verify what was
  already seeded correctly" no-ops: "Creer la competition" (name/place
  start blank), "Configurer Salle 18m FFTA" (case starts on World
  Archery / Outdoor 70m / 4 distances and must be corrected to French
  rules / Indoor 18m / 2 distances), "Configurer les departs" (depart 2
  starts with no archers-per-target configured), and "Participants" (both
  training archers start without an age class, tying into the H/F vs M/W
  FFTA trap documented in that lesson). "Affectation des cibles" already
  had this shape; only its broken check above needed fixing.
- Add `modules/formation/tests/formation.scripts.test.js`: regression
  tests over `formation.scripts.json` itself, asserting each lesson's
  seed is genuinely incomplete/wrong at init time and that its check
  targets a column the API can actually read/write. These would have
  caught both bugs fixed above.

## 0.1.0
- Add the first contextual eLearning course.
- Add automatic validators backed by Ianseo tables.
- Store progression in `ModulesParameters` per active tournament.
