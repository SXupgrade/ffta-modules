# Assistant changelog

## Unreleased

- Add organizer-reported checklist items: locked creation trio (local rule /
  type / sub-rule), FFTA organizer code, FFTA licensed archer database
  import/refresh, entry Tir ind./Épreuve ind. flags, club flags download,
  and the "all results" vs "event ranking" printout distinction.
- Add an optional `warningKey` on checklist items to surface pitfalls that
  have no in-app safeguard (destructive target reassignment, UPPERCASE
  false positives on archer database refresh, silent double-counted
  podiums, etc.), rendered as a highlighted alert on the item card.
- Wire up `judge.responsible.declared`'s automatic check end to end: add
  an `officials.list()` accessor to the shared
  `core/module-api/services/data.service.js` (calling `listOfficials`,
  mirroring the existing `clubs`/`divisions`/`classes` accessors), a lab
  mock case in `lab/src/mockIanseoRuntime.js` backed by a new
  `lab/mock-data/officials.json` fixture (wired into all 5 lab data
  scenarios), and regression tests — including one exercising the real
  `createDataService()` end to end — proving `assistant.scanner.js`
  now genuinely detects a declared responsible judge in the lab, the
  same as the other five auto-checks. No real Ianseo backend action
  exists yet for `listOfficials` (or for any other `data.service.js`
  action, in any module); a future implementation should reuse the query
  `export-ffta`'s `FftaExportRepository::getResponsibleJudges()` already
  uses (`TournamentInvolved` joined to `InvolvedType`, `ItId=5`).

## 0.1.0

- Add organizer checklist timeline module.
- Add manual Done / N/A / To do status management.
- Add automatic scan metrics for current tournament.
- Add event-driven PoC buttons for Compet+ future domain events.
- Add FR/EN i18n and module styles.
- Add domain tests.

## Print checklist update
- Added a print action for the organizer checklist.
- Added print-specific layout with visible checkboxes and timeline grouping.
