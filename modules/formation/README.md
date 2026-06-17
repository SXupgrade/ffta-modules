# Formation

V1 eLearning module for Ianseo training sessions.

The course follows the 2024 simplified FFTA Ianseo tutorial path:
installation awareness, updates/resources, tournament creation, FFTA 18m setup, sessions, divisions/classes/distances, participants, target assignment, score sheets, score entry, ranking and TXT export.

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
