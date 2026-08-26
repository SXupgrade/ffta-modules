# Assistant module

Organizer checklist proof of concept for FFTA Modules / Compet+.

The module provides a before / during / after tournament timeline with mandatory and optional tasks. Each item can be manually marked as done, marked as N/A, or automatically validated when SDK metrics or Compet+ domain events are available.

## Current PoC scope

- Tournament identity check.
- Local rule / competition type / sub-rule lockdown warning.
- FFTA organizer code check.
- Responsible judge declaration.
- FFTA licensed archer database import.
- Target face order reminder around J-20.
- Awards order reminder.
- Entries imported check.
- Individual shoot / individual event flag check (multi-session entries).
- Full field assignment check, with a warning on destructive target reassignment.
- Archer database refresh reminder, with a warning on UPPERCASE false positives.
- Club flags/logos download reminder.
- Scorecards printed event.
- Chronotir / timing device charge reminder.
- Field installation and target face setup.
- Qualification scoring flow check.
- Live display event.
- Rankings check.
- All-results vs. event-ranking printout warning.
- FFTA export event.
- Records check event.
- Final archive reminder.

## Pitfall warnings

A handful of items carry an optional `warningKey` on top of their usual
`descriptionKey`/`tooltipKey`. These surface organizer-reported Ianseo
pitfalls that have no in-app safeguard (a locked-in creation trio, a
destructive target-shift screen with no undo, entry flags that silently
double-count a podium, etc.). They render as a highlighted alert on the
checklist item and are always visible, independent of the item's status.

## Data strategy

No new Ianseo table is required. Manual statuses are stored in local runtime storage. Automatic checks first try `data.request('scanTournamentAssistant')`, then fallback to current SDK services when available.

### What actually auto-completes today

`scanTournamentAssistant` doesn't exist as a backend action anywhere yet, so
every scan currently falls through to the per-field SDK calls. Of those,
`data.tournament.getCurrent`, `data.entries.list` and
`data.scores.readQualificationScores` are real accessors
(`core/module-api/services/data.service.js`) with lab mocks
(`lab/src/mockIanseoRuntime.js`), so these auto-checks genuinely work in
the lab and against a wired-up Ianseo backend:

- `tournament.identity.confirmed`, `entries.imported`, `field.assigned`,
  `qualification.scored`, `results.checked`.

`judge.responsible.declared` is catalogued with `checkKey: 'hasResponsibleJudge'`
and `assistant.scanner.js` does compute `responsibleJudgeCount` correctly
from an `officials` array — but `data.officials` has no accessor in the
shared data service and no lab mock, unlike the four calls above. The
fetch resolves to `[]` via optional chaining, so this one item is
manual-only in practice today despite looking automatic in the catalog.
Wiring it up for real needs, at minimum: a `data.officials.list()`
accessor in `data.service.js`, a lab mock case + fixture, and (for a real
Ianseo backend) the query `export-ffta`'s `FftaExportRepository::getResponsibleJudges()`
already uses — `TournamentInvolved` joined to `InvolvedType`, filtered on
`ItId=5` — which is more precise than this module's current
description-string heuristic (`isResponsibleJudge()` in `assistant.scanner.js`).
