# Records module

`records` is an MVVM module for `ffta-modules` and Compet+ that manages Ianseo-compatible tournament records without adding custom database tables.

## MVP scope

- Configure a monitored record area for the current tournament.
- Persist the area in `RecAreas`.
- Persist the tournament link in `TourRecords`.
- Import records into `RecTournament` from CSV or JSON.
- Display records already imported for the tournament.
- Display records detected in `RecBroken`.
- Recalculate MVP individual qualification broken records into `RecBroken`.

## Import format

The preferred import is a CSV file using the canonical standings format:

```csv
recordCode;recordLabel;category;categoryName;total;maxScore;tieBreaker;holderName;holderClubOrCountry;place;date;isTeam;isMixed;isPara
RECORD;TAE National;S1HCL;Sénior 1 Homme Classique;675;720;32;DUPONT Jean;1300000;Aix-en-Provence;2026-01-01;0;0;0
BEST 2025/2026;TAE National;S1HCL;Sénior 1 Homme Classique;662;720;28;MARTIN Paul;1300000;Marseille;2025-09-21;0;0;0
```

Mapping to Ianseo:

```text
recordCode          -> RtRecCode
recordLabel         -> RtRecDistance
category            -> RtRecCategory
categoryName        -> RtRecCategoryName
total               -> RtRecTotal
maxScore            -> RtRecMaxScore
tieBreaker          -> RtRecXNine
holderName          -> RtRecExtra
holderClubOrCountry -> RtRecExtra
place               -> RtRecExtra
date                -> RtRecDate
isTeam              -> RtRecTeam
isMixed             -> RtRecDouble
isPara              -> RtRecPara
```

Imports are stored in the global catalog with `RtTournament = 0`. `recordCode` is read per row, so one CSV can import several areas at once. For Ianseo `OrisStatRecStanding.php`, `category` must match `Events.EvCode` when `RecAreas.ReArWaMaintenance = 0`.

JSON imports remain supported with the same canonical field names. Legacy aliases such as `eventCode`, `distance`, `score`, `xNine`, `archer`, `noc`, and `eventNoc` are still accepted.

## Ianseo tables touched

- `RecAreas`
- `TourRecords`
- `RecTournament`

`RecBroken` is written by the `Check broken records` action for MVP individual qualification records. The action recalculates rows for the current tournament where `RtRecTeam = 0` and `RtRecPhase = 1`.

## Notes

The module intentionally uses the current tournament from Ianseo session context when available. If no session tournament is found, it falls back to the latest tournament as a developer-friendly degraded mode.

## v0.1.2 ORIS compatibility

`OrisStatRecStanding.php` joins records with `Events` by `RtRecCategory = Events.EvCode` for non-WA-maintained areas. Use the tournament event code as `eventCode`. The importer also generates a minimal PHP-serialized `RtRecExtra` value when no raw serialized value is supplied.

## v0.1.3 broken-record check

The `Check broken records` action scans individual qualification scores only. A record is considered broken when `QuScore > RtRecTotal`, or when the score is equal and `QuXNine > RtRecXNine`. The generated `RecBroken` rows are compatible with `OrisStatRecBroken.php`. Team records and match records are intentionally left for a later version.


## Global catalog and tournament snapshot

Since `0.1.5`, imported records are stored globally with:

```text
RecTournament.RtTournament = 0
```

This global catalog can contain federation, regional, departmental or club records. For a real tournament, use **Activate records for this tournament** and select the desired record codes. The module copies matching rows from tournament `0` to the current tournament id, creating a date-fixed snapshot that Ianseo ORIS reports can read.

Typical codes:

```text
WR      World records
ER      European records
FR      French records
REG-NAQ Regional records
DEP-33  Department records
CLUB    Club records
```

The broken-record checker still works against the current tournament snapshot, not directly against the global catalog.

## ORIS standing records compatibility

When record areas are activated for the current tournament, the module now fills empty `Events.EvRecCategory` values with `Events.EvCode`. Ianseo ORIS standing records use `EvRecCategory` in their grouping query; leaving it empty can collapse many records into only a few printed rows. Existing non-empty values are preserved.
