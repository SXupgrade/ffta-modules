# FFTA Modules Lab

FFTA Modules Lab is a local Ianseo simulator for module development. It lets developers load SDK modules, switch ACL profiles, use mock tournament data and validate manifest-only modules before installing them in a real Ianseo instance.

## Start

```bash
cd lab
npm install
npm run dev
```

Open the Vite URL displayed in the terminal, usually `http://localhost:5173`.

## What the lab simulates

- Ianseo runtime context (`app.runtime.type = "ianseo"` with `app.runtime.isLab = true`).
- `app.acl` with selectable profiles: admin, read-only, mixed and no-access.
- `app.data` read/write calls for common mock entities.
- `app.i18n` and module translation loading.
- Manifest validation for classic, MVVM and simple modules.
- API delay and API error scenarios.

## Add a module to the lab

Edit `lab/index.html` and add a module declaration:

```js
window.__FFTA_MODULES__ = [
  { id: 'my-module', manifestPath: '../modules/my-module/module.manifest.js', basePath: '../modules/my-module/' }
];
```

For quick experimentation, you can also point to an example folder:

```js
{ id: 'simple-scores', manifestPath: '../examples/simple-scores-module/module.manifest.js', basePath: '../examples/simple-scores-module/' }
```

## Mock data

Mock datasets are stored in `lab/mock-data/`:

- `tournament.json`
- `entries.json`
- `qualification-scores.json`
- `acl-profiles.json`

The mock data adapter currently supports:

- `getCurrentTournament`
- `listEntries`
- `readQualificationScores`
- `writeQualificationScore`
- `listTargets`

## Intentional limitation

This is not a full Ianseo clone. It is a developer host for SDK contracts. Real SQL, Ianseo sessions and final federation exports still need validation inside a real Ianseo instance.

## Fake Competition Generator

The Lab includes a deterministic generator for mock tournaments. You can configure archers, sessions, archers per target and a seed. The generated dataset becomes the `Generated competition` scenario and is persisted in the browser until **Reset data** is used.

## Module Certification

Each selected module gets a certification panel covering manifest validity, ACL, i18n, write permission declarations and Lab data availability. Use **Run certification** to store the current browser-local result.

