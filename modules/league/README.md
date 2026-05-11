# Championnat par équipe

Reference module for `ffta-modules`.

## Business rules MVP

- One primary/master tournament is linked to 1 to 8 rounds.
- The 1 to 8 round limit mirrors available score slots used by the database model.
- Standings are grouped by class/division.
- Typical standings groups: HCL, FCL, HCO, FCO.
- Qualification points are awarded using a configurable free grid.
- Match points can use either:
  - match-win points, or
  - bracket final ranking points.
- The general standings show every team with round-by-round point details.
- A PDF export of general standings is required.

## Implementation rules

- Keep `domain/` pure and testable.
- Repositories map Ianseo tables to `LeagueInput`.
- UI consumes only the ViewModel.
