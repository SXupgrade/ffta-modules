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

## 0.1.0
- Add the first contextual eLearning course.
- Add automatic validators backed by Ianseo tables.
- Store progression in `ModulesParameters` per active tournament.
