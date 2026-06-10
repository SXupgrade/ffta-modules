# Assistant module

Organizer checklist proof of concept for FFTA Modules / Compet+.

The module provides a before / during / after tournament timeline with mandatory and optional tasks. Each item can be manually marked as done, marked as N/A, or automatically validated when SDK metrics or Compet+ domain events are available.

## Current PoC scope

- Tournament identity check.
- Responsible judge declaration.
- Target face order reminder around J-20.
- Awards order reminder.
- Entries imported check.
- Full field assignment check.
- Scorecards printed event.
- Chronotir / timing device charge reminder.
- Field installation and target face setup.
- Qualification scoring flow check.
- Live display event.
- Rankings check.
- FFTA export event.
- Records check event.
- Final archive reminder.

## Data strategy

No new Ianseo table is required. Manual statuses are stored in local runtime storage. Automatic checks first try `data.request('scanTournamentAssistant')`, then fallback to current SDK services when available.
