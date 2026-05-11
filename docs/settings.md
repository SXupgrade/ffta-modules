# Settings

## Principle

A module **declares** settings.  
The runtime **decides** where they are stored.  
The module **only reads/writes through `app.settings`**.

Modules must never call `ModulesParameters` directly. That is the adapter's responsibility.

## Declaring settings in the manifest

```js
settings: [
  { key: 'my-module.someSetting',  type: 'string',  defaultValue: '' },
  { key: 'my-module.aNumber',      type: 'number',  defaultValue: 0 },
  { key: 'my-module.anArray',      type: 'array',   defaultValue: [] }
]
```

## Registering a schema in mount

```js
app.settings.registerSchema('my-module', {
  someSetting: { type: 'string', defaultValue: '' },
  aNumber:     { type: 'number', defaultValue: 0 }
});
```

## Reading a setting

```js
const value = await app.settings.get('my-module.someSetting', 'fallback');
```

## Writing a setting

```js
await app.settings.set('my-module.someSetting', 'new value');
```

## Ianseo storage

In the Ianseo runtime, settings are stored in the `ModulesParameters` table:

| MpModule | MpParameter | MpValue |
|---|---|---|
| `ffta-modules` | `league.masterTournamentCode` | `"LEAGUE2026"` |
| `ffta-modules` | `league.roundTournamentCodes` | `["R1","R2"]` |

Values are JSON-encoded on write and decoded on read to support arrays, numbers, and booleans.

## League setting keys

```
league.masterTournamentCode
league.roundTournamentCodes
league.groupBy
league.qualificationPointsGrid
league.matchPointsMode
league.matchWinPoints
league.bracketPointsGrid
league.pointsMode
```

## Security

Settings are stored and retrieved server-side via `api/settings.php`. All SQL is escaped using Ianseo's `StrSafe_DB` helper. No credentials are stored — the adapter reuses Ianseo's existing database connection.
