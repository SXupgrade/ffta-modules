
## v0.2.4 - Lab generator and module certification

- Added a Fake Competition Generator in the Lab with configurable archers, sessions, archers per target and deterministic seed.
- Added a persistent generated competition scenario backed by localStorage.
- Added Module Certification with manifest, ACL, i18n, write-permission and Lab data checks.
- Added certification status badge and last-run metadata per module.
- Documented the generator/certification workflow.

# Patch notes — ffta-modules v0.2.1

## Added

- `lab/` local Ianseo simulator based on Vite.
- Mock runtime with `app.acl`, `app.data`, `app.i18n`, notifications and tournament context.
- ACL profiles: admin, read-only, mixed and no-access.
- Mock data for tournament, entries, qualification scores and targets.
- Module selector and manifest validation panel.
- API delay and API error simulation switches.

## Changed

- `app.data.tournament.getCurrent`, `entries.list`, `scores.readQualificationScores` and `targets.list` now accept an optional `options` argument for module-aware ACL checks.

## Notes

The lab validates SDK integration but does not replace final validation inside a real Ianseo installation.

## v0.2.2 - SDK packs and Lab scenarios

- Added SDK services: `app.ui`, `app.files`, `app.logger`, `app.validation`.
- Expanded `app.data` with entries, scores, targets, clubs, divisions and classes helpers.
- Added write helpers for qualification scores and target assignment.
- Extended `api/data.php` with the matching read/write actions and server-side ACL checks.
- Extended the Lab with API modes, data scenarios, theme switch and device frame switch.
- Added Lab templates for simple read-only, simple read/write, export helper and MVVM modules.
- Added documentation in `docs/sdk-packs-and-lab.md`.

## v0.2.3 - Dev mode configuration

- Added `config/ffta-modules.config.js` and development example config.
- Added `app.dev` service with channel-based log activation.
- Updated `app.logger` to respect dev mode and log levels.
- Added optional console traces for runtime, ACL, data and HTTP API calls.
- Added optional `window.__FFTA_APP__` / `window.__FFTA_DEV__` debug handles.
- Added optional floating dev badge in the Ianseo shell.
- Added Dev mode toggle in the Lab sidebar.

## v0.2.5 - Developer Wiki module

- Added `modules/developer-wiki`, an embedded SDK/Lab wiki for beginner-friendly module development.
- Added step-by-step guides for simple manifest-first modules and MVVM modules.
- Added examples for qualification score reading/writing, Lab testing and certification workflows.
- Added AI-friendly prompts and release checklists directly inside the module.
- Registered the wiki in the Lab module list and ACL mock profiles.

## v0.2.8 - Lab module URL fix

- Fixed export-ffta module URLs by resolving API and test dataset paths from import.meta.url instead of current browser route.
- Prevents nested relative paths such as modules/export-ffta/api/modules/export-ffta/api/... in Vite Lab.
