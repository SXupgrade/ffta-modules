# ffta-modules

Lightweight community module platform intended to be installed inside an existing Ianseo installation at:

```txt
Modules/Custom/ffta-modules
```

The first reference module is **Championnat par équipe** (`modules/league`).

## Goals

- Provide a small, clean module platform for FFTA/community modules.
- Reuse the host Ianseo installation configuration, session, database connection, language and tournament context.
- Keep modules portable enough to be reused later by Compet+ through the same contracts.
- Keep the public module contract small and stable.

## Non-goals

- Do not include Compet+ private code.
- Do not implement Compet+ desktop runtime here.
- Do not implement Compet+ web `/api/v1` here.
- Do not add licensing, updater, cloud sync, live publishing or premium themes.
- Do not ask users for database host/user/password. The module must reuse Ianseo config.

## Architecture

```txt
core/      Lightweight module platform and Ianseo adapters
modules/   Community modules
league/    Reference module: Championnat par équipe
docs/      Developer documentation
examples/  Minimal module skeleton
```

## Important implementation rule

Modules must consume only the public module API:

```js
app.t()
app.settings.get()
app.settings.set()
app.routes.register()
app.menu.register()
app.services.get()
app.notify.success()
app.notify.error()
app.modal.open()
app.exports.csv()
app.exports.xlsx()
app.context.getTournament()
```

Modules must not directly depend on Ianseo internals, SQL helpers, MariaDB, SQLite, Electron or Compet+ internals.


## Update

The root UI includes a simple `[update module]` button. It downloads the latest `ffta-modules.zip` GitHub release asset and overwrites the current module files in place. No backup is created.

Expected release asset URL:

```txt
https://github.com/FFTA/ffta-modules/releases/latest/download/ffta-modules.zip
```


## SDK 1.1 highlights

- Module manifests can declare ACL requirements with `access`. The shell resolves `none`, `read` and `write` access and hides unauthorized modules.
- Server APIs can use `ffta_acl_require()` to enforce read/write permissions.
- Manifest-only `type: 'simple'` modules are supported for small utility screens.
- Common data services are available through `app.data` for tournament context, entries, qualification scores and targets.

See `docs/acl-and-simple-modules.md` and `examples/simple-scores-module`.
