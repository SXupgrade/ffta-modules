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

## Compet+ compatibility

Compet+ compatibility is achieved through contracts, not by importing Compet+ code.
