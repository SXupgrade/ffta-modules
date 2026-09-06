# rule-builder

Module `ffta-modules` that exports the current tournament's configured
ruleset -- divisions, classes, events, distances, target faces, sessions
-- as a JSON file, in the exact shape compet+'s own
`scripts/rules/generate-fr-ianseo-sets.js` produces from its static
`Custom/sets/FR/*` templates (see that repo's `rules/FR/README-ianseo-sets.md`
for the authoritative shape contract this must match, and
`features/tournaments/rules/ianseo-set-adapter.js` for the consumer that
turns this JSON into tournament-creation seed data).

Where compet+'s own generator starts from a hand-maintained PHP source
template and derives a JSON export, this module does the reverse: it
starts from an **already-open, live tournament** and reads its actual
configured rules straight out of Ianseo's own database, then reshapes them
into that same JSON contract. Use it to turn a real, working competition
setup into a reusable template without re-typing every division, class,
event and distance by hand.

## Usage

Open the tournament whose ruleset you want to capture (this module always
operates on Ianseo's own "currently open" tournament -- the one selected
in the admin UI -- same convention as the `gdpr` and `export-ffta`
modules; there is no separate tournament picker). Open the Rule Builder
screen and click "Download JSON".

## Shape

```
{
  Tournament: { ToType, ToLocRule, ToTypeName, ToTypeSubRule, ToCategory,
    ToNumDist, ToNumEnds, ToMaxDistScore, ToMaxFinIndScore,
    ToMaxFinTeamScore, ToElabTeam, ToElimination, ToGolds, ToGoldsChars,
    ToXNine, ToXNineChars, ToDouble, ToIocCode, ToCollation },
  Divisions: [ { DivTournament, DivViewOrder, DivId, DivDescription,
    DivAthlete, DivRecDivision, DivWaDivision, DivIsPara }, ... ],
  Classes: { seasonStartDate, ageShiftWhenSeasonStarted, items: [
    { ClTournament, ClViewOrder, ClAgeFrom, ClAgeTo, ClSex, ClId,
      ClValidClass, ClDescription, ClAthlete, ClDivisionsAllowed,
      ClRecClass, ClWaClass, ClIsPara }, ... plus any SubClass rows,
      merged into the same list -- see "SubClass" below ] },
  Events: { items: [ { ...52 Ev* fields, individual and team events
    together } ], classes: [ { EcTournament, EcTeamEvent, EcNumber,
    EcCode, EcDivision, EcClass, EcSubClass, EcExtraAddons }, ... ] },
  Distances: { rounds: [ { TdTournament, TdType, TdClasses, Td1, TdDist1,
    ... as many Td{n}/TdDist{n} pairs as configured }, ... ],
    information: [ { DiTournament, DiType, DiSession, DiDistance, DiEnds,
      DiArrows }, ... ] },
  Blasons: [ { TfTournament, TfId, TfName, TfRegExp|TfClasses, TfDefault,
    TfT1, TfW1, ... as many pairs as configured }, ... ],
  Sessions: [ { SesTournament, SesOrder, SesType, SesName,
    SesTar4Session, SesAth4Target, SesFirstTarget, SesFollow }, ... ]
}
```

Every `*Tournament` foreign-key field is exported as the literal string
`"{ToId}"`, matching the one genuine placeholder token confirmed against
compet+'s own ground-truth export (`rules/FR/SetFRTAE-Valides.json`) --
`ianseo-set-adapter.js` substitutes the real new tournament's ID at
creation time.

## Three deliberate departures from a hand-authored template

A live tournament simply doesn't carry the same information a
hand-maintained FR template does. Rather than guess, this module is
explicit about what it cannot faithfully reconstruct:

- **`Tournament.ToSubRule` is omitted.** It identifies which entry of
  compet+'s own `SET_DEFS` catalog (`scripts/rules/run.js`) a static
  template corresponds to -- it is not an Ianseo database column at all
  (confirmed against the real `Tournament` table's full column list via a
  schema dump), so there is no live value to read for an arbitrary
  organizer-configured tournament.
- **`Classes.ageShiftWhenSeasonStarted` is always `0`, and
  `ClAgeFrom`/`ClAgeTo` are exported exactly as stored.** A static FR
  template bakes in a fixed age-shift convention (September-start
  school-year classes), applied at tournament-creation time by
  `ianseo-set-adapter.js`. A live tournament's stored ages are already
  whatever they resolved to for that one tournament's own date -- and may
  since have been hand-edited by an organizer via Ianseo's
  `ManDivClass.php` screen, with no reliable way to tell
  shifted-at-creation apart from edited-since. Reversing an assumed shift
  on data we cannot verify was ever shifted risks silently producing wrong
  ages; exporting as-is is always correct for what was actually captured.
  **Practical effect**: a ruleset exported from this module and reused for
  a future tournament will NOT auto-shift ages for that tournament's own
  season -- whoever re-imports one should know this.
- **`ClRecClass`/`ClWaClass`/`DivRecDivision`/`DivWaDivision` are exported
  as-is, with no fallback to `ClId`/`DivId` when blank.** Same
  ground-truth-confirmed behavior `generate-fr-ianseo-sets.js` documents
  for its own static templates -- the consumer's own
  `applyRecWaClassFallback`/`applyRecWaDivisionFallback` already handle
  that fallback, so duplicating it here would be redundant at best and
  could mask a genuinely blank source value at worst.

## SubClass

Ianseo's `SubClass` table (`Sc*` columns) is a real, separate table, but
it is **not** its own top-level key in the JSON contract -- confirmed
against `generate-fr-ianseo-sets.js`'s `createSubClass()`, which pushes
its rows into the very same array `createClass()` does. This module
reproduces that: `Classes.items` is `Cl*` rows followed by any `Sc*` rows
for the tournament, in one flat list.

## Column selection is deliberately narrower than each table's full schema

`repositories/ianseo/IanseoRuleBuilderRepository.php`'s queries select
only the columns the compet+ contract actually carries, not every column
a live table has. Runtime/bookkeeping columns -- `Events.EvRunning`,
`Events.EvQualLastUpdate`, `DistanceInformation.DiDay`/`DiWarmStart`,
`TargetFaces.TfWaTarget`, and others -- are excluded on purpose: carrying
them through would leak the SOURCE tournament's live state into what is
meant to be a reusable rules template for a NEW tournament.

`Events` also filters `EvCodeParentWinnerBranch=0`, excluding
automatically-derived elimination sub-bracket events (e.g. a "5th-8th
place" branch spawned by a main bracket's own settings) -- the same
filter `gdpr`'s `GdprPublishService::listEvents()` already uses for its
own event picker, for the same reason: these aren't organizer-configured
template events, they're generated from another event's own settings.

## Architecture

- `repositories/ianseo/IanseoRuleBuilderRepository.php` -- read-only
  queries against the live `Tournament`, `Divisions`, `Classes`,
  `SubClass`, `Events`, `EventClass`, `TournamentDistances`,
  `DistanceInformation`, `TargetFaces`, `Session` tables, scoped to one
  `ToId`.
- `application/RuleBuilderExportService.php` -- reshapes those raw rows
  into the JSON contract above (`{ToId}` substitution, SubClass merge,
  Td/TfT-W trailing-pair trimming, TfRegExp/TfClasses selection). Its
  constructor deliberately has no class type-hint on `$repository` (unlike
  this repo's usual convention) so it can be unit-tested with a plain stub
  object without ever loading the real repository's own
  `core/adapters/ianseo/database/bootstrap.php` chain, which refuses to
  load outside a real Ianseo install -- see
  `tests/ruleBuilderExportService.selftest.php`.
- `api/rule-builder.php` -- `status` (current tournament identification),
  `download` (builds and streams the JSON as a file attachment).
- `ui/pages/RuleBuilderPage.js` -- single screen: tournament summary,
  "Download JSON" button.

## Verification

No live Ianseo/MySQL instance is available in this environment to
exercise `IanseoRuleBuilderRepository`'s real queries against, or to
confirm the exact live column layout beyond a static schema dump review
(`Ianseo/Install/dbdumps/*/ianseodump.sql`). Verified here: `php -l` on
every PHP file, `node --check` on every JS file,
`tests/ruleBuilderExportService.selftest.php` (31 checks against a
stubbed repository -- shape, `{ToId}` substitution, SubClass merge,
trimming rules, JSON round-trip), `tests/ruleBuilder.i18n.test.js` (en/fr
key coverage). **Before relying on this for a real event, run it against
a real tournament and diff the result against
`rules/FR/SetFRTAE-Valides.json`'s shape** (same field names, same nesting)
to confirm the live column layout still matches what this module assumes.
