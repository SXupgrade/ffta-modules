# Patch notes — Ianseo shell and DB reuse

This patch fixes two integration issues for `Modules/Custom/ffta-modules`:

1. `index.php` now renders inside the standard Ianseo page shell by including `Common/Templates/head.php` and `Common/Templates/tail.php`.
2. The Ianseo database adapter now reuses Ianseo's existing `config.php`, session, DB helpers and `ModulesParameters` behavior.

## Important details

- No full `<!doctype>`, `<html>`, `<head>` or `<body>` is emitted by `index.php` anymore.
- CSS is scoped under `.ffta-modules-shell` to avoid breaking Ianseo global styles.
- DB credentials are never requested or stored.
- The bootstrap path assumes the project is installed exactly at `Modules/Custom/ffta-modules`.
- Settings are tournament-scoped through `ModulesParameters(MpModule, MpParameter, MpTournament, MpValue)`.
- Ianseo helper functions used when available: `safe_r_sql`, `safe_w_sql`, `safe_w_BeginTransaction`, `safe_w_Commit`, `safe_w_Rollback`, `getModuleParameter`, `setModuleParameter`, `getModule`.

## Files changed

- `index.php`
- `core/adapters/ianseo/database/bootstrap.php`
- `core/adapters/ianseo/database/query.php`
- `core/adapters/ianseo/database/transaction.php`
- `core/adapters/ianseo/settings/ModulesParametersAdapter.php`
- `core/ui/styles/foundation.css`
- `core/ui/styles/utilities.css`
- `modules/league/ui/styles/league.css`
