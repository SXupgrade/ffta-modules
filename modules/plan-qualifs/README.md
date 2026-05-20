# Plan de cible — Qualifications

This module is now a native `ffta-modules` module.

## Architecture

- `module.manifest.js`: module declaration for PHP autodiscovery.
- `module.mount.js`: registers i18n, route, menu and repository.
- `domain/`: constants/contracts only.
- `application/`: store, ViewModel and use cases.
- `repositories/`: repository contract and Ianseo implementation.
- `api/`: Ianseo-facing JSON endpoint used by the repository.
- `ui/`: native ffta-modules page and scoped CSS.

## Native behavior

The module no longer renders the historical PlanQualifs page, iframe, shell, legacy CSS or legacy JavaScript.
The UI is rendered by `ui/pages/PlanQualifsPage.js`, uses HTML5 drag/drop, and calls the repository/API for data and assignment actions.

## Data access

The PHP API reuses Ianseo bootstrap/session/ACL/database helpers and maps the tournament data to JSON:

- sessions
- face recap
- picking groups
- unassigned archers
- targets and slots

Assignment updates are still written directly to Ianseo `Qualifications` fields through repository actions.
