# Settings

Standalone Ianseo mode stores settings in `ModulesParameters`.

Modules must declare their settings schema and consume values only through:

```js
app.settings.get(key)
app.settings.set(key, value)
```

League setting keys:

```txt
league.masterTournamentCode
league.roundTournamentCodes
league.groupBy
league.qualificationPointsGrid
league.matchPointsMode
league.matchWinPoints
league.bracketPointsGrid
```
