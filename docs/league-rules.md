# League rules MVP

The League module is shown as `Championnat par équipe` in French.

## Model

- One primary/master tournament.
- 1 to 8 linked rounds maximum.
- Standings grouped by class/division.
- Typical groups: HCL, FCL, HCO, FCO.

## Points

Qualification points use a configurable free grid:

```json
[
  { "rank": 1, "points": 8 },
  { "rank": 2, "points": 6 },
  { "rank": 3, "points": 4 }
]
```

Match/final phase points use one of these modes:

```txt
match-wins
bracket-final-ranking
```

## Output

- General standings per category.
- Round-by-round points detail.
- PDF export of general standings.
