# Adapters

## Purpose

Adapters isolate runtime-specific details from module business logic. A module never imports Ianseo internals directly — it uses only the public Module API, which delegates to adapters.

## Ianseo adapter stack

```
core/adapters/ianseo/
  database/
    bootstrap.php        Locates and loads Ianseo config.php
    query.php            Wrappers: ffta_query, ffta_write, ffta_escape, ffta_in_list
    transaction.php      ffta_transaction(callback)
  settings/
    ModulesParametersAdapter.php   Read/write ModulesParameters table
    settings.repository.php        HTTP handler for api/settings.php
  runtime/
    createIanseoRuntime.js         JS runtime context factory
  i18n/
    languageAdapter.js             Detect language from <html lang> / navigator
```

## Database helpers

All SQL runs through `core/adapters/ianseo/database/query.php` which wraps Ianseo's native helpers:

| Helper | Purpose |
|---|---|
| `ffta_query($sql)` | Execute a read query |
| `ffta_write($sql)` | Execute a write query |
| `ffta_fetch_all($result)` | Fetch all rows as objects |
| `ffta_fetch_one($result)` | Fetch first row or null |
| `ffta_escape($value)` | Escape a value using `StrSafe_DB` |
| `ffta_in_list($values)` | Build a safe `IN(...)` clause |
| `ffta_transaction($callback)` | Wrap in a transaction |

## Ianseo-specific assumptions

The Ianseo adapter makes the following assumptions, all marked `TODO(ianseo-verified)`:

| Assumption | Source |
|---|---|
| Config file is `config.php` or `config.inc.php` | Public schema |
| Active tournament is `$_SESSION['TourId']` | Public source |
| DB read helper is `safe_r_SQL` | brian-nelson mirror |
| DB write helper is `safe_w_SQL` | brian-nelson mirror |
| Escape function is `StrSafe_DB` | brian-nelson mirror |
| Tournament name column is `ToWhere` | brian-nelson mirror |
| Individuals table has `IndRank`, `IndTournament`, `IndEntry`, `IndScore` | brian-nelson mirror |

All items marked `TODO(ianseo-verified)` must be confirmed against a live installation before deploying.

## Bootstrap path

From `Modules/Custom/ffta-modules/core/adapters/ianseo/database/bootstrap.php`, the search order for `config.php` is:

```
../../../../../../config.php           (4 levels up from database/)
../../../../../../config.inc.php
../../../../../../../config.php        (5 levels up)
../../../../../../../config.inc.php
```

Adjust if your Ianseo installation uses a different structure.

## Ianseo does not duplicate configuration

The adapter never stores database host, username, or password. It always loads Ianseo's own `config.php` which already contains the connection settings. This is the key reason `bootstrap.php` exists.

## Adding an adapter for a new runtime

1. Create `core/adapters/<runtime>/`.
2. Implement the same adapter interfaces as the Ianseo adapter.
3. Create a `create<Runtime>Runtime.js` that returns a `RuntimeContext`.
4. Modules that support this runtime add `'<runtime>'` to `runtimeCompatibility`.
