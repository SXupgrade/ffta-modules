# Architecture

`ffta-modules` is a lightweight module platform intended to run inside an existing Ianseo installation.

## Installation path

```
Ianseo root/
  Modules/
    Custom/
      ffta-modules/         ← this repository
        index.php
        main.js
        core/
        modules/
        api/
        docs/
```

## Directory structure

```
core/
  module-loader/     Module discovery, loading, validation
  module-api/        Public API exposed to every module
  adapters/ianseo/   Ianseo-specific runtime adapters
  ui/                Lightweight shared components
  i18n/              Core translation strings

modules/
  league/            Reference module: Team Championship

docs/
examples/
```

## Layers

```
domain/          Pure business logic — no UI, no fetch, no SQL
repositories/    Data access contracts and Ianseo adapters
application/     Store, ViewModel, use cases
ui/              Components and pages (render-only)
```

## Runtime rules

- The standalone runtime identifier is `'ianseo'`.
- The module platform reuses Ianseo's config, database connection, session/auth, language, and tournament context.
- The platform never asks for database credentials.
- DB access goes through `core/adapters/ianseo/database/query.php` which wraps Ianseo's `safe_r_SQL` / `safe_w_SQL` helpers.

## MVVM rules

```
domain/       pure functions, testable without any runtime
application/  store + view-model + use cases; orchestrates domain + repository
ui/           renders state, delegates actions to view-model
```

Neither domain nor application layer may import from `ui/`.
The `ui/` layer must not call fetch or SQL directly.

## Module isolation

Modules communicate with each other and with the platform exclusively through the public Module API (`app.*`).  
A module must never:
- Import from another module's directory.
- Import private Ianseo internals.
- Import Compet+ code.
- Call `safe_r_SQL` / `safe_w_SQL` directly — only through `core/adapters/ianseo/database/query.php`.

## Formation module

The `formation` module keeps the editable training catalog in `modules/formation/data/formation.steps.csv`. This CSV is intentionally Excel-friendly, accepts comma, semicolon and tab separators, and uses the columns `stepId`, `title`, `objectives`, `learningText`, `images`, `exercise`, `scriptInitExercise`, and `scriptVerifExercise`. Image filenames listed in `images` are comma-separated and must refer to files stored directly in `modules/formation/data/`. `modules/formation/data/formation.course.js` provides the same content as a runtime fallback when the static CSV cannot be fetched.

The UI renders a generic step card from those columns: title, objectives, course text, optional application exercise, optional exercise initialization, optional exercise verification, exercise result, and final step validation. The application layer only orchestrates CSV loading, refresh, validation and case preparation.

Initialization and verification script identifiers are declared in `modules/formation/data/formation.scripts.json`. The CSV references those identifiers only; it never contains SQL or PHP. Initialization scripts are declarative action lists such as `updateTournament`, `upsertSession`, `upsertEntry`, `upsertQualification`, `upsertDivision`, `upsertClass`, `upsertTournamentDistance`, and `runInitScript`. Verification scripts are declarative checks such as `activeTournament`, `fieldNotEmpty`, `fieldContains`, `fieldEquals`, `count`, and `or`; `count` checks are compiled to scoped `SELECT COUNT(*)` queries by the API. Database preparation and verification are implemented in `modules/formation/api/formation.php` because they must run inside the Ianseo runtime and reuse the active `TourId`. Seeds are intentionally scoped to the active tournament and use `FFTA-FORM-*` sample identifiers for generated archers. The API whitelists supported tables/columns and introspects table columns before inserts/updates so the same training workflow can tolerate small Ianseo schema differences without storing or requesting database credentials. Script output is normalized as `ok`, `ko` or `warning` with messages for the UI.

## Compet+ compatibility

Compet+ compatibility is achieved through contracts, not by importing Compet+ code.
