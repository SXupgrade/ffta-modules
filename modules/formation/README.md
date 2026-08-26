# Formation

V1 eLearning module for Ianseo training sessions.

The course follows the 2024 simplified FFTA Ianseo tutorial path:
installation awareness, updates/resources, tournament creation, FFTA 18m
setup, sessions, divisions/classes/distances, field team, FFTA license
database synchronization, participants, individual shoot / individual
event entry flags, target assignment, score sheets, score entry,
all-results vs. event-ranking printouts, ranking/TXT export and ISK/
Scorekeeper lite.

Four of the lessons (FFTA database sync, entry flags, results printout
distinction, ISK lite) are knowledge-only: they carry no exercise, the
same way the existing "Personnel et arbitres" lesson does, because they
document organizer pitfalls that have no reliable database check.

Progress is stored in Ianseo `ModulesParameters` with module name `ffta-formation`, so it follows the active tournament export/import.

## Editable course file

The course content is driven by `data/formation.steps.csv`, which can be edited with Excel and saved back as CSV UTF-8. The parser accepts comma, semicolon and tab separators.

Expected columns:

```txt
stepId,title,objectives,learningText,images,exercise,scriptInitExercise,scriptVerifExercise
```

- Put image filenames in `images` as a comma-separated list, for example `"step1_image1.jpg, foo.jpg, bar.jpg"`.
- Store referenced image files directly in `data/`.
- Leave `exercise` empty to hide the application exercise block.
- Leave `scriptInitExercise` empty to hide the exercise initialization button.
- Leave `scriptVerifExercise` empty to hide the exercise verification button.
- `scriptInitExercise` and `scriptVerifExercise` are script identifiers declared in `data/formation.scripts.json`; they are not arbitrary SQL or PHP code.
- Script execution happens in `api/formation.php`, after the normal `ffta-modules` Ianseo bootstrap. Database access reuses Ianseo's active session, active tournament and DB helpers; no connection credentials are stored in the training files.
- Script responses are normalized as `ok`, `ko` or `warning`, with one or more messages displayed in the exercise card.

Reusable initialization action types currently supported by the API:

```txt
updateTournament
upsertCountry
upsertSession
upsertEntry
upsertQualification
upsertDivision
upsertClass
upsertTournamentDistance
runInitScript
```

Each action is scoped to the active tournament and limited to whitelisted Ianseo columns in `api/formation.php`.
Entry values can reference a club/country created by `upsertCountry` with `{ "ref": "country:CODE" }`; the API resolves it to the matching `Countries.CoId` before writing `Entries`.

Reusable verification check types currently supported by the API:

```txt
activeTournament
fieldNotEmpty
fieldContains
fieldEquals
count
or
```

`count` checks build scoped `SELECT COUNT(*)` queries from declarative JSON. Supported joins are intentionally limited; currently `Qualifications` can join `Entries` to scope scores and target assignments to the active tournament.

## Writing a real exercise, not a no-op

A lesson's `scriptInitExercise` and `scriptVerifExercise` only prove the
trainee did something when the seeded starting state cannot already
satisfy the check. `wrong_target` / `target_case_fixed` is the reference
pattern: the init script deliberately moves Camille Martin to the wrong
target (`QuTarget: "5"`), and the check only passes once she is back on
`QuTarget=2` / `QuLetter=A` — the state the `participants` baseline
originally gave her. Several other lessons follow the same shape:
`tournament_identity` seeds a blank name/place, `ffta_18m` seeds World
Archery / Outdoor 70m / 4 distances instead of French rules / Indoor 18m,
`sessions` leaves the second depart with no archers-per-target, and
`participants` seeds both training archers without an age class.

When adding or editing an init/check pair:

- Only use columns listed in `formation_allowed_columns()` in
  `api/formation.php` — a check field that isn't whitelisted is silently
  dropped from the `WHERE` clause instead of erroring, which quietly turns
  a check into a no-op. `modules/formation/tests/formation.scripts.test.js`
  guards the columns used by the current checks; add a case there for any
  new one.
- Reference real entry codes. `upsertQualification` looks up the entry by
  `entryCode` and returns a `ko` result (visible in the exercise card, but
  easy to miss) if it doesn't exist — copy-pasting a code from another
  script is the most common way to break a seed silently.
- Prefer reusing the two training archers (`1000123A` Camille Martin,
  `1000456Z` Noa Bernard) seeded by the `participants` script over
  inventing new placeholder codes, so nested `runInitScript` calls stay
  consistent across lessons.
