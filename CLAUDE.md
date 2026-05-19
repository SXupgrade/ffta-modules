# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`ffta-modules` is a lightweight community module platform that runs inside an existing **Ianseo** archery tournament software installation, deployed at:

```
<ianseo-root>/Modules/Custom/ffta-modules/
```

It reuses Ianseo's existing PHP config, database connection, session/auth, language detection, and tournament context. It **never** asks for database credentials and **never** imports Compet+ private code.

The first and reference module is `modules/league/` — **Championnat par équipe** (team league standings).

## Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
node --test modules/league/tests/league.points.test.js
```

Tests use Node.js built-in `node:test` and `node:assert/strict` — no test framework to install. There are no devDependencies.

Linting is not yet configured (`npm run lint` is a no-op placeholder).

## Architecture

### Directory layout

```
core/
  module-loader/     Load, validate, and register modules
  module-api/        Public API (createModuleContext) exposed to every module via app.*
  adapters/ianseo/   Ianseo-specific PHP + JS adapters (DB, settings, runtime, i18n)
  ui/                Shared HTML-string components (CpModal, CpTable, CpButton, etc.)
  i18n/              Core platform translation strings

modules/league/      Reference module (team championship)
api/                 Thin PHP entry points: settings.php, context.php
main.js              Bootstrap: create runtime → context → load module → mount page
index.php            HTML shell loaded by Ianseo

examples/minimal-module/   Skeleton for new modules
docs/                      Developer documentation
```

### Bootstrap flow

`main.js` → `createIanseoRuntime()` → `createModuleContext(runtime)` → `loadModule(manifest, mountFn)` → `mountLeaguePage()`

`loadModule` validates the manifest, checks `runtimeCompatibility`, then calls `mountModule(app)` which registers i18n, settings schema, routes, services, and returns the ViewModel.

### MVVM layers (enforced for every module)

```
domain/          Pure functions — no fetch, no DOM, no SQL, no app context
repositories/    Data access only; maps raw rows to domain contracts; no calculations
application/     Store (mutable state) + ViewModel (actions) + use cases (orchestration)
ui/              Components return HTML strings; pages subscribe to store and re-render
```

**Forbidden cross-layer imports:**
- `domain/` must not import from `repositories/`, `application/`, or `ui/`
- `application/` must not import from `ui/`
- `ui/` must not call `fetch` or SQL directly

### Public Module API

Modules communicate with the platform **only** through `app.*`:

```js
app.t(key, params?)                   // translate
app.i18n.registerNamespace(ns, {en,fr})
app.settings.get(key, default?)       // async
app.settings.set(key, value)          // async
app.routes.register({ path, labelKey, component })
app.menu.register({ id, label, route })
app.services.register(name, svc) / .get(name)
app.notify.success/error/info(msg)
app.modal.open({ title, body, footer? })
app.exports.csv/json/pdf(filename, data)
app.context.getTournament()           // async → { id, code, name, venue } | null
app.runtime.type                      // 'ianseo'
app.runtime.language                  // 'fr'
```

Modules must **never** import from another module's directory, from `core/` internals (other than via `app.*`), or call Ianseo helpers (`safe_r_SQL`, `StrSafe_DB`) directly.

### PHP ↔ JS data path (league module)

```
LeagueQueries.php → LeagueMapper.php → league.php API
  → IanseoLeagueRepository.js (fetch)
    → league.standings.js (pure calculation)
      → LeagueStore → LeaguePage (re-render)
```

All database access goes through `core/adapters/ianseo/database/query.php` helpers:
`ffta_query`, `ffta_write`, `ffta_fetch_all`, `ffta_fetch_one`, `ffta_escape`, `ffta_in_list`, `ffta_transaction`.

### Settings storage

Settings are persisted server-side in Ianseo's `ModulesParameters` table (columns `MpModule`, `MpParameter`, `MpValue`). Values are JSON-encoded to support arrays, numbers, and booleans. The JS side reads/writes through `api/settings.php`; modules only call `app.settings.get/set`.

## Key conventions

### i18n
- All user-visible strings go through `app.t(key)`. No hardcoded French labels in JS or PHP.
- English (`en.json`) is required; French (`fr.json`) is required for FFTA deployment.
- Namespace registration in `module.mount.js`: `app.i18n.registerNamespace('my-module', { en, fr })`
- Key convention: `app.t('my-module.section.key')` — namespace is the module id.
- Interpolation uses `{placeholder}` syntax in JSON values.

### Module manifest
Required fields: `sdkVersion`, `id` (kebab-case `^[a-z0-9][a-z0-9-]*$`), `name`, `version`, `entry`, `runtimeCompatibility`.

### UI components
- Components are plain functions returning HTML strings — no framework.
- Always call `escapeHtml()` on external data to prevent XSS.
- Event handling uses `data-action` attributes and `addEventListener` delegation on a container.

### Store subscribe pattern
```js
store.subscribe(() => {
  root.innerHTML = MyPage({ state: store.state, app });
});
```

### Domain tests
Domain logic is pure and tested with JSON fixtures in `tests/fixtures/`. Add new fixtures as plain JSON matching the `LeagueInput` shape defined in `domain/league.contracts.js`.

## Creating a new module

1. Copy `examples/minimal-module/` to `modules/my-module/`
2. Fill in `module.manifest.js` (unique kebab-case `id`, correct `runtimeCompatibility`)
3. Implement `mountModule(app)` in `module.mount.js`
4. Wire i18n, settings schema, routes, menu, and services inside `mountModule`
5. Register in `main.js`: import manifest + mount fn, call `loadModule(...)`
6. Follow MVVM layer boundaries strictly

See `docs/create-module.md` for a full step-by-step guide.

## Unverified Ianseo assumptions

Items marked `TODO(ianseo-verified)` in the source must be confirmed against a live Ianseo installation before deploying:

| Assumption | Location |
|---|---|
| Config file is `config.php` or `config.inc.php` | `core/adapters/ianseo/database/bootstrap.php` |
| Active tournament is `$_SESSION['TourId']` | `api/context.php` |
| DB helpers are `safe_r_SQL` / `safe_w_SQL` | `core/adapters/ianseo/database/query.php` |
| Escape function is `StrSafe_DB` | `core/adapters/ianseo/database/query.php` |
| Tournament display column is `ToWhere` | `api/context.php` |
| Individual results columns: `IndRank`, `IndTournament`, `IndEntry`, `IndScore` | `repositories/ianseo/LeagueQueries.php` |
