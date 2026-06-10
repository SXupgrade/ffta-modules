
## v0.2.1

- Aligned records table columns with the canonical CSV/JSON import-export format.
- Displayed holder name, club/country and place extracted from `RtRecExtra`.
- Added record editing from the records table.
- Saved edited holder data back into Ianseo-compatible `RtRecExtra`.

# Records Module Changelog

## 0.2.0

- Align CSV exports with the canonical records import format.
- Align JSON exports with the canonical records import format using `{ schemaVersion: "1.0", records: [] }`.
- Rebuild export fields from `RecTournament`, including holder data extracted from serialized `RtRecExtra`.
- Add round-trip coverage so exported JSON can be imported again without losing the canonical fields.

## 0.1.13

- Roll back the v0.1.12 local i18n fallback approach.
- Align records translations with the league module contract: `registerNamespace('records', { en, fr })` receives packs whose root is the module content, not an extra `records` wrapper.
- Keep every UI call as `app.t('records.*')`, letting the shared ffta-modules i18n namespace resolver add the namespace, exactly like `league`.


## v0.1.11

- Fixed i18n namespace collision caused by the top-level `records` translation group.
- Wrapped translation files under the `records` namespace so `app.t('records.*')` resolves all nested labels consistently.

# Changelog

## 0.1.10

- Ensure `Events.EvRecCategory` is populated with `Events.EvCode` when records are activated for a tournament.
- This keeps ORIS standing records from grouping all records together when `EvRecCategory` is empty.
- The update only fills empty values and preserves any custom `EvRecCategory` already set by Ianseo or a federation set.

## 0.1.9

- Add CSV file import through the browser file picker.
- Replace the importer mapping with the canonical global records CSV format.
- Map `recordCode` per row to `RtRecCode`, allowing one CSV to contain multiple areas such as `RECORD` and `BEST 2025/2026`.
- Map `recordLabel` to `RtRecDistance`, `category` to `RtRecCategory`, `categoryName` to `RtRecCategoryName`, `total` to `RtRecTotal`, `maxScore` to `RtRecMaxScore`, and `tieBreaker` to `RtRecXNine`.
- Serialize holder name, club/country code and place into `RtRecExtra`.
- Support row-level `isTeam`, `isMixed`, and `isPara` flags mapped to `RtRecTeam`, `RtRecDouble`, and `RtRecPara`.

## 0.1.8

- Add Current tournament and Standings catalog views.
- Add checkbox-based tournament record area synchronization: selected areas copy records from tournament 0, deselected areas remove the current tournament snapshot.
- Add RecAreas create/delete actions from the standings catalog view.
- Move import/export buttons to the standings catalog view.
- Add a global catalog update action based on detected broken records for the current tournament.

## 0.1.7

- Align records i18n files with the league module format: namespace registered in `module.mount.js`, JSON files contain unprefixed nested keys only.
- Remove dotted duplicate translation keys that can confuse validation and future tooling.
- Add an i18n coverage test that scans `app.t('records.*')` usage and validates both English and French packs.

# Records module changelog

## 0.1.0

- Add MVP MVVM module skeleton.
- Add Ianseo repository and JSON API.
- Add monitored record area configuration.
- Add CSV/JSON import preview and persistence to `RecTournament`.
- Add records and broken records views.

## 0.1.2

- Align import mapping with Ianseo ORIS record standing printout: `eventCode` maps to `RtRecCategory`.
- Generate a minimal serialized `RtRecExtra` holder payload from `archer`, `noc`, and `eventNoc`.
- Keep backward compatibility with raw serialized `RtRecExtra` values.

## 0.1.3

- Add `Check broken records` action.
- Recalculate MVP individual qualification broken records into `RecBroken`.
- Match records through `Events`, `EventClass`, `Entries`, and `Qualifications` so ORIS broken-record printouts can read the generated rows.

## 0.1.6

- Add flat i18n compatibility keys while keeping nested translations, so older loaders resolve labels beyond the module title.
