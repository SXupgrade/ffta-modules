# League Rules

The League module is displayed as **Championnat par équipe** in French.

## Concept

A league championship links:
- One **master tournament** (the umbrella entity).
- Between **1 and 8 round tournaments** (individual competition events).

Standings are computed by aggregating points from each round, grouped by class/division category.

The **8-round limit** exists because the module maps each round to a score slot index (1..8).

## Supported category groups

Default grouping strategy: `division-class`. Typical groups:

| Code | Description |
|---|---|
| HCL | Men — Recurve |
| FCL | Women — Recurve |
| HCO | Men — Compound |
| FCO | Women — Compound |

Groups are derived from the Ianseo Divisions + Classes data. The groupBy setting controls the grouping key. Only `division-class` is implemented in v0.1.

## Points modes

### `qualification-ranking`

Points are assigned from a configurable free grid based on a team's qualification ranking in each round.

```json
[
  { "rank": 1, "points": 8 },
  { "rank": 2, "points": 6 },
  { "rank": 3, "points": 4 },
  { "rank": 4, "points": 2 }
]
```

If a rank has no configured value, 0 points are awarded.

### `match-wins`

Points are awarded per match won in the elimination bracket. Value is configurable (`matchWinPoints`).

### `bracket-ranking`

Points are assigned from a configurable free grid based on the team's final ranking in the elimination bracket.

```json
[
  { "rank": 1, "points": 10 },
  { "rank": 2, "points": 7 },
  { "rank": 3, "points": 5 },
  { "rank": 4, "points": 3 }
]
```

### `combined`

Qualification points + match/bracket points are accumulated. The `matchPointsMode` setting selects whether the second component uses match wins or bracket ranking.

## Tie-breaking

When two teams have equal `totalPoints`:
1. Higher `qualificationPoints` wins.
2. Alphabetical `teamName` (ascending) as final deterministic tie-break.

## Settings reference

| Setting key | Type | Description |
|---|---|---|
| `league.masterTournamentCode` | string | Ianseo tournament code for the master event |
| `league.roundTournamentCodes` | array | Ordered list of 1..8 round tournament codes |
| `league.groupBy` | string | Grouping strategy — currently `'division-class'` |
| `league.pointsMode` | string | `qualification-ranking`, `match-wins`, `bracket-ranking`, `combined` |
| `league.qualificationPointsGrid` | array | `[{rank, points}, ...]` |
| `league.matchWinPoints` | number | Points per match win |
| `league.bracketPointsGrid` | array | `[{rank, points}, ...]` |

## Data flow

```
Ianseo DB
  → LeagueQueries.php        (raw rows)
    → LeagueMapper.php        (LeagueInput shape)
      → league.php API        (JSON response)
        → IanseoLeagueRepository.js (fetch)
          → league.standings.js     (pure calculation)
            → LeagueStore           (state update)
              → LeagueStandingsTable (render)
```

## Warnings

The module emits warnings in these situations:

| Code | Level | Condition |
|---|---|---|
| `missing-master` | error | `masterTournamentCode` is empty |
| `missing-rounds` | warning | `roundTournamentCodes` is empty |
| `too-many-rounds` | error | More than 8 rounds configured |
| `missing-round-data` | warning | A configured round has no Ianseo data |

Warnings are displayed in the UI above the standings table and do not block rendering of partial results.

## PDF export

The "Export PDF" button opens a print-ready page in a new browser window. Press **Ctrl+P** (or Cmd+P) to print or save as PDF. The print stylesheet hides toolbars and adjusts layout automatically.
