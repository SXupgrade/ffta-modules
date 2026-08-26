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
- Document (README + code comment in `assistant.scanner.js`) that
  `judge.responsible.declared` cannot actually auto-complete via a live or
  lab scan today: `data.officials` has no accessor in the shared
  `core/module-api/services/data.service.js` and no lab mock, unlike
  the tournament/entries/scores calls the other four auto-checks use, so
  the fetch silently resolves to `[]`. `buildMetrics()` already computes
  `responsibleJudgeCount` correctly when given real officials data — only
  the transport is missing. Add regression tests locking in today's
  graceful-degrade-to-0 behavior and the expected behavior once a
  `data.officials.list()` accessor exists.

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
