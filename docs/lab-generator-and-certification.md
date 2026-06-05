# FFTA Modules Lab - Generator and Certification

## Fake Competition Generator

The Lab can now generate a deterministic mock tournament without touching a real Ianseo instance.

Available options:

- `entries`: number of archers to generate, from 1 to 2000.
- `sessions`: number of qualification sessions, from 1 to 8.
- `archersPerTarget`: number of archers per target, from 1 to 4.
- `seed`: deterministic seed used to reproduce the same dataset.

Generated data is stored in `localStorage` under the `generated` scenario. Use **Reset data** to return to the standard scenario.

The generator currently creates:

- tournament context;
- entries;
- target assignments;
- qualification score rows;
- deterministic ranks.

This is intended for UI stress tests, ACL checks, read/write data flows and demos.

## Module Certification

The Lab also exposes a per-module certification report. It checks:

- manifest validity;
- SDK compatibility declaration;
- marketplace metadata presence;
- ACL subFeature declaration;
- ACL profile coverage;
- English/French i18n declaration;
- write-like actions requiring `permission: 'write'`;
- tournament context availability;
- entries and qualification scores availability.

Certification statuses:

- **Certified**: no errors and no warnings.
- **Certified with warnings**: no blocking error, but cleanup is recommended.
- **Certification failed**: at least one blocking error.

The **Run certification** button stores a browser-local timestamp and score for the selected module.

## Developer workflow

```bash
cd lab
npm install
npm run dev
```

Then:

1. Select a module.
2. Generate a fake competition if needed.
3. Switch ACL profile, language, API mode, theme and viewport.
4. Run certification.
5. Fix warnings/errors before validating against a real Ianseo.
