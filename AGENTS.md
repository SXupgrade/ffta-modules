# Instructions for Codex / Claude Code agents

You are working in a new standalone repository named `ffta-modules`.

## Context

This repository is a lightweight community module platform intended to run inside an existing Ianseo installation at:

```txt
Modules/Custom/ffta-modules
```

The repository must be self-contained and must not import Compet+ private code.

## External references to inspect

Use public Ianseo resources to discover the correct bootstrap/config/database/session/tournament/language patterns:

- Official website: https://www.ianseo.net
- Releases page: https://www.ianseo.net/Releases.php
- Public non-official mirror useful for reading code: https://github.com/brian-nelson/ianseo
- Example third-party module repository: https://github.com/PJ1004/ianseo-mod-nz

Treat GitHub mirrors as references only. Do not assume they are official.

## Mandatory rules

1. Do not request or store database host/user/password.
2. Reuse Ianseo config, session, database connection, language and tournament context.
3. Keep all source code identifiers, variables and comments in English.
4. UI default strings must be English or i18n keys; French labels must be in `fr.json`.
5. No hardcoded UI labels outside i18n files, except temporary TODO comments.
6. Keep MVVM boundaries clear:
   - `domain/` = pure business logic
   - `repositories/` = data access and mapping
   - `application/` = stores, view-models and use cases
   - `ui/` = rendering only
7. The League module UI label in French is `Championnat par équipe`.
8. The root UI label is `FFTA`.
9. Qualification points must use a configurable free grid, not hardcoded presets.
10. Add tests and fixtures for domain logic.

## Build order

Implement in this order:

1. Module manifest contract and validator.
2. Module context and public Module API.
3. Ianseo runtime adapter.
4. Settings adapter backed by `ModulesParameters`.
5. i18n service.
6. Router/menu/basic UI registration.
7. League domain contracts: `LeagueInput`, `LeagueStandingResult`, `LeagueSettings`, `LeagueWarning`.
8. League repository mapping from Ianseo tables.
9. League MVVM application layer.
10. League UI.
11. PDF export for general standings.
12. Tests and documentation.

## Deliverable expectation

Replace TODO stubs with working code while preserving the structure and contracts unless there is a strong reason to adjust them. Document any change in `docs/architecture.md`.
