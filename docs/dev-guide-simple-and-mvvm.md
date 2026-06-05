# FFTA Modules SDK — Step-by-step guide for simple and MVVM modules

This guide is intentionally beginner-friendly and strict enough to be used by a human developer or by an AI coding agent.

The goal is to create two modules:

1. A **simple manifest-only module** that displays qualification scores and can save one mock score.
2. A **full MVVM module** that displays qualification scores, edits a score through a small ViewModel, then passes Lab certification.

All file names, variable names, comments and default UI strings are in English. User-facing text must go through i18n files.

---

## 0. Vocabulary

| Term | Meaning |
| --- | --- |
| SDK | The shared `ffta-modules` runtime exposed to modules through `app.*`. |
| Lab | The local simulator used to test modules without a real Ianseo installation. |
| Manifest | The `module.manifest.js` file that declares the module identity, ACL, i18n and entry points. |
| Simple module | A module mostly driven by `module.manifest.js`, without custom MVVM files. |
| MVVM module | A full module with View, ViewModel, Store and/or Service files. |
| ACL | Access control. The SDK exposes `read`, `write`, or no access depending on Ianseo ACL tables or Lab profiles. |
| Certification | Lab validation that checks manifest, ACL, i18n, simple actions, read-only safety and compatibility. |

---

## 1. Start the Lab

From the SDK root:

```bash
cd lab
npm install
npm run dev
```

Open the URL displayed by Vite, usually:

```txt
http://localhost:5173
```

In the Lab interface, test with these controls:

- ACL profile: `admin`, `read-only`, `mixed`, `no-access`
- API mode: `normal`, `slow`, `random errors`, `offline`
- Data scenario: `default`, `empty`, `large`, `generated competition`
- Language: `en`, `fr`
- Theme: `light`, `dark`
- Device frame: `desktop`, `tablet`, `mobile`

Before coding anything, click **Run certification** on the existing sample module. This confirms the Lab itself works.

---

## 2. SDK APIs used in this guide

### Read qualification scores

```js
const rows = await app.data.scores.listQualificationScores(
  { session: 1 },
  { moduleId: 'my-module' }
);
```

Alias also supported:

```js
const rows = await app.data.scores.readQualificationScores(
  { session: 1 },
  { moduleId: 'my-module' }
);
```

### Save a qualification score

```js
await app.data.scores.saveQualificationScore(
  { quId: 101, score: 315 },
  { moduleId: 'my-module' }
);
```

The SDK automatically checks write permission. In read-only mode, this call must fail cleanly.

### Check ACL

```js
const canRead = await app.acl.canRead('my-module');
const canWrite = await app.acl.canWrite('my-module');
```

### Use i18n

```js
app.t('my-module.title')
```

### Use UI helpers

```js
app.ui.renderTable({ columns, rows })
app.ui.setReadonlyMode(root, true)
```

### Use logs

```js
app.logger.info('Scores loaded', { count: rows.length });
app.logger.error('Score save failed', error);
```

Logs are controlled by `config/ffta-modules.config.js` and the Lab dev mode toggle.

---

# PART A — Create a simple module

A simple module is best when you need:

- a small screen;
- a few read/write actions;
- no complex state;
- no custom UI logic;
- fast development.

For example: “show qualification scores” and “save one score”.

---

## A1. Create the folder

Create:

```txt
modules/simple-score-editor/
├─ i18n/
│  ├─ en.json
│  └─ fr.json
├─ README.md
└─ module.manifest.js
```

---

## A2. Create `module.manifest.js`

```js
export default {
  sdkVersion: '1.2.0',
  type: 'simple',
  id: 'simple-score-editor',
  name: 'Simple Score Editor',
  version: '0.1.0',
  description: 'Simple module that reads qualification scores and saves one mock score.',
  runtimeCompatibility: ['ianseo', 'lab'],
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  capabilities: ['i18n', 'data:qualification-scores'],
  access: {
    acl: 'AclModules',
    subFeature: 'simpleScoreEditor',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: {
    accentColor: '#0f766e'
  },
  page: {
    titleKey: 'simple-score-editor.title',
    descriptionKey: 'simple-score-editor.description',
    actions: [
      {
        id: 'readScores',
        labelKey: 'simple-score-editor.actions.readScores',
        permission: 'read',
        handler: {
          service: 'scores',
          method: 'listQualificationScores',
          payload: { session: 1 }
        }
      },
      {
        id: 'saveMockScore',
        labelKey: 'simple-score-editor.actions.saveMockScore',
        permission: 'write',
        handler: {
          service: 'scores',
          method: 'saveQualificationScore',
          payload: { quId: 101, score: 315 }
        }
      }
    ]
  }
};
```

Important rules:

- `id` must be unique.
- `type: 'simple'` tells the loader to build the page automatically.
- `access.subFeature` must be stable because it maps to ACL checks.
- Every write action must use `permission: 'write'`.
- Every read action should use `permission: 'read'`.

---

## A3. Create `i18n/en.json`

```json
{
  "title": "Simple score editor",
  "description": "Read qualification scores and save a mock score through the SDK.",
  "actions": {
    "readScores": "Read qualification scores",
    "saveMockScore": "Save mock score"
  }
}
```

---

## A4. Create `i18n/fr.json`

```json
{
  "title": "Éditeur simple de scores",
  "description": "Lire les scores de qualification et enregistrer un score mock via le SDK.",
  "actions": {
    "readScores": "Lire les scores de qualification",
    "saveMockScore": "Enregistrer un score mock"
  }
}
```

---

## A5. Create `README.md`

```md
# Simple Score Editor

This is a manifest-only module.

It demonstrates:

- qualification score reading;
- qualification score writing;
- ACL read/write behavior;
- Lab certification.
```

---

## A6. Register the module in the Lab

If the Lab module list is static, add the module path next to the other Lab modules.

Look for a module registry or import list in:

```txt
lab/src/main.js
```

Add an import similar to existing examples:

```js
import simpleScoreEditorManifest from '../../modules/simple-score-editor/module.manifest.js';
```

Then add it to the manifests array:

```js
const manifests = [
  simpleScoreEditorManifest
];
```

If the current Lab version auto-discovers modules, no manual registration is needed.

---

## A7. Test the simple module in Lab

Test matrix:

| Scenario | Expected result |
| --- | --- |
| ACL `admin` | Read and write actions are available. |
| ACL `read-only` | Read action works, write action is disabled or denied cleanly. |
| ACL `no-access` | Module should not be usable. |
| API `slow` | UI should not crash. |
| API `offline` | Error is displayed cleanly. |
| Language `fr` | French labels are displayed. |
| Theme `dark` | UI remains readable. |
| Device `mobile` | Page remains usable. |

---

## A8. Run certification

In the Lab:

1. Select `Simple Score Editor`.
2. Click **Run certification**.
3. Fix every error.
4. Warnings are acceptable temporarily, but avoid shipping with warnings if possible.

Target result:

```txt
Certified
100% · 0 errors
```

---

# PART B — Create a full MVVM module

Use MVVM when you need:

- custom UI;
- state management;
- multiple actions;
- forms;
- advanced validation;
- future extension.

The example below creates a score viewer/editor with:

- a ViewModel;
- a Store;
- a Service;
- a View;
- ACL-aware write button;
- Lab certification.

---

## B1. Create the folder

Create:

```txt
modules/mvvm-score-editor/
├─ application/
│  ├─ score-editor.store.js
│  └─ score-editor.vm.js
├─ domain/
│  └─ score.service.js
├─ i18n/
│  ├─ en.json
│  └─ fr.json
├─ ui/
│  └─ ScoreEditorView.js
├─ README.md
├─ module.manifest.js
├─ module.mount.js
└─ module.routes.js
```

---

## B2. Create `module.manifest.js`

```js
export default {
  sdkVersion: '1.2.0',
  id: 'mvvm-score-editor',
  name: 'MVVM Score Editor',
  version: '0.1.0',
  description: 'MVVM module that reads and edits qualification scores.',
  entry: './module.mount.js',
  routes: './module.routes.js',
  runtimeCompatibility: ['ianseo', 'lab'],
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  capabilities: ['i18n', 'routing', 'data:qualification-scores'],
  access: {
    acl: 'AclModules',
    subFeature: 'mvvmScoreEditor',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: {
    accentColor: '#2563eb'
  }
};
```

---

## B3. Create `module.routes.js`

```js
import { mountScoreEditorView } from './ui/ScoreEditorView.js';

export default [
  {
    path: '/mvvm-score-editor',
    name: 'mvvm-score-editor.index',
    mount: mountScoreEditorView
  }
];
```

---

## B4. Create `module.mount.js`

```js
import routes from './module.routes.js';
import { createScoreEditorStore } from './application/score-editor.store.js';
import { createScoreService } from './domain/score.service.js';
import { createScoreEditorVm } from './application/score-editor.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  const moduleId = 'mvvm-score-editor';

  app.i18n.registerNamespace(moduleId, { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: moduleId,
    label: app.t('mvvm-score-editor.navigation.title'),
    route: '/mvvm-score-editor'
  });

  const store = createScoreEditorStore();
  const scoreService = createScoreService({ app, moduleId });
  const vm = createScoreEditorVm({ app, moduleId, store, scoreService });

  app.services.register('mvvm-score-editor.vm', vm);

  return { vm };
}
```

---

## B5. Create `application/score-editor.store.js`

```js
export function createScoreEditorStore() {
  const state = {
    loading: false,
    saving: false,
    readonly: true,
    rows: [],
    selectedQuId: null,
    draftScore: '',
    error: null
  };

  return {
    state,
    setLoading(value) {
      state.loading = Boolean(value);
    },
    setSaving(value) {
      state.saving = Boolean(value);
    },
    setReadonly(value) {
      state.readonly = Boolean(value);
    },
    setRows(rows) {
      state.rows = Array.isArray(rows) ? rows : [];
    },
    setSelectedScore({ quId, score }) {
      state.selectedQuId = quId ?? null;
      state.draftScore = score == null ? '' : String(score);
    },
    setDraftScore(value) {
      state.draftScore = String(value ?? '');
    },
    setError(error) {
      state.error = error ? String(error.message || error) : null;
    }
  };
}
```

---

## B6. Create `domain/score.service.js`

```js
export function createScoreService({ app, moduleId }) {
  return {
    async listScores() {
      return app.data.scores.listQualificationScores(
        { session: 1 },
        { moduleId }
      );
    },

    async saveScore({ quId, score }) {
      return app.data.scores.saveQualificationScore(
        { quId, score },
        { moduleId }
      );
    }
  };
}
```

---

## B7. Create `application/score-editor.vm.js`

```js
export function createScoreEditorVm({ app, moduleId, store, scoreService }) {
  const { state } = store;
  const listeners = new Set();

  function notify() {
    for (const listener of listeners) listener(state);
  }

  async function load() {
    store.setLoading(true);
    store.setError(null);
    notify();

    try {
      const canWrite = await app.acl.canWrite(moduleId);
      store.setReadonly(!canWrite);

      const rows = await scoreService.listScores();
      store.setRows(rows);

      app.logger.info('Qualification scores loaded', { moduleId, count: rows.length });
    } catch (error) {
      store.setError(error);
      app.logger.error('Unable to load qualification scores', error);
    } finally {
      store.setLoading(false);
      notify();
    }
  }

  function selectScore(row) {
    store.setSelectedScore({
      quId: row.quId ?? row.entryId ?? row.id,
      score: row.score ?? row.total ?? 0
    });
    notify();
  }

  function updateDraftScore(value) {
    store.setDraftScore(value);
    notify();
  }

  async function saveSelectedScore() {
    if (state.readonly) {
      app.notify.error(app.t('mvvm-score-editor.messages.readonly'));
      return;
    }

    const score = Number(state.draftScore);
    if (!Number.isFinite(score) || score < 0) {
      app.notify.error(app.t('mvvm-score-editor.messages.invalidScore'));
      return;
    }

    store.setSaving(true);
    store.setError(null);
    notify();

    try {
      await scoreService.saveScore({
        quId: state.selectedQuId,
        score
      });
      app.notify.success(app.t('mvvm-score-editor.messages.saved'));
      await load();
    } catch (error) {
      store.setError(error);
      app.logger.error('Unable to save qualification score', error);
      app.notify.error(app.t('mvvm-score-editor.messages.saveFailed'));
    } finally {
      store.setSaving(false);
      notify();
    }
  }

  return {
    state,
    load,
    selectScore,
    updateDraftScore,
    saveSelectedScore,
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    }
  };
}
```

---

## B8. Create `ui/ScoreEditorView.js`

```js
export async function mountScoreEditorView({ root, app }) {
  const vm = app.services.get('mvvm-score-editor.vm');

  if (!vm) {
    root.innerHTML = '<p>Score editor ViewModel is not registered.</p>';
    return;
  }

  const render = (state) => {
    root.innerHTML = `
      <section class="ffta-page">
        <header class="ffta-page__header">
          <h1>${app.t('mvvm-score-editor.title')}</h1>
          <p>${app.t('mvvm-score-editor.description')}</p>
        </header>

        ${state.error ? `<div class="cp-alert cp-alert--danger">${escapeHtml(state.error)}</div>` : ''}
        ${state.readonly ? `<div class="cp-alert cp-alert--info">${app.t('mvvm-score-editor.readonly')}</div>` : ''}

        <div class="cp-card">
          <h2>${app.t('mvvm-score-editor.sections.scores')}</h2>
          ${state.loading ? '<p>Loading…</p>' : renderScoresTable(state, app)}
        </div>

        <div class="cp-card">
          <h2>${app.t('mvvm-score-editor.sections.edit')}</h2>
          <label>
            ${app.t('mvvm-score-editor.fields.score')}
            <input
              type="number"
              min="0"
              value="${escapeAttribute(state.draftScore)}"
              data-score-input
              ${state.readonly ? 'disabled' : ''}
            />
          </label>
          <button
            type="button"
            class="cp-btn cp-btn--primary"
            data-save-score
            data-requires-write
            ${state.readonly || state.saving || !state.selectedQuId ? 'disabled' : ''}
          >
            ${state.saving ? app.t('mvvm-score-editor.actions.saving') : app.t('mvvm-score-editor.actions.save')}
          </button>
        </div>
      </section>
    `;

    app.ui.setReadonlyMode(root, state.readonly);

    root.querySelectorAll('[data-select-score]').forEach((button) => {
      button.addEventListener('click', () => {
        const quId = Number(button.dataset.quId);
        const row = state.rows.find((item) => Number(item.quId ?? item.entryId ?? item.id) === quId);
        if (row) vm.selectScore(row);
      });
    });

    root.querySelector('[data-score-input]')?.addEventListener('input', (event) => {
      vm.updateDraftScore(event.target.value);
    });

    root.querySelector('[data-save-score]')?.addEventListener('click', () => {
      vm.saveSelectedScore();
    });
  };

  const unsubscribe = vm.subscribe(render);
  await vm.load();

  return () => unsubscribe();
}

function renderScoresTable(state, app) {
  if (!state.rows.length) {
    return app.ui.renderEmptyState({
      title: app.t('mvvm-score-editor.empty.title'),
      description: app.t('mvvm-score-editor.empty.description')
    });
  }

  return `
    <table class="cp-table">
      <thead>
        <tr>
          <th>${app.t('mvvm-score-editor.table.name')}</th>
          <th>${app.t('mvvm-score-editor.table.club')}</th>
          <th>${app.t('mvvm-score-editor.table.target')}</th>
          <th>${app.t('mvvm-score-editor.table.score')}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${state.rows.map((row) => renderScoreRow(row, app)).join('')}
      </tbody>
    </table>
  `;
}

function renderScoreRow(row, app) {
  const quId = row.quId ?? row.entryId ?? row.id;
  const name = row.name ?? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim();

  return `
    <tr>
      <td>${escapeHtml(name || '-')}</td>
      <td>${escapeHtml(row.club ?? row.clubName ?? '-')}</td>
      <td>${escapeHtml(row.target ?? row.targetNo ?? '-')}</td>
      <td>${escapeHtml(row.score ?? row.total ?? 0)}</td>
      <td>
        <button type="button" class="cp-btn cp-btn--ghost" data-select-score data-qu-id="${escapeAttribute(quId)}">
          ${app.t('mvvm-score-editor.actions.select')}
        </button>
      </td>
    </tr>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, '&#039;');
}
```

---

## B9. Create `i18n/en.json`

```json
{
  "navigation": {
    "title": "Score editor"
  },
  "title": "Qualification score editor",
  "description": "Read and edit qualification scores through the FFTA Modules SDK.",
  "readonly": "Read-only mode is active. Score editing is disabled.",
  "sections": {
    "scores": "Qualification scores",
    "edit": "Edit selected score"
  },
  "fields": {
    "score": "Score"
  },
  "table": {
    "name": "Archer",
    "club": "Club",
    "target": "Target",
    "score": "Score"
  },
  "actions": {
    "select": "Select",
    "save": "Save score",
    "saving": "Saving…"
  },
  "messages": {
    "readonly": "You do not have write access.",
    "invalidScore": "The score is invalid.",
    "saved": "Score saved.",
    "saveFailed": "Unable to save score."
  },
  "empty": {
    "title": "No scores",
    "description": "No qualification score is available for this scenario."
  }
}
```

---

## B10. Create `i18n/fr.json`

```json
{
  "navigation": {
    "title": "Éditeur de scores"
  },
  "title": "Éditeur de scores de qualification",
  "description": "Lire et modifier les scores de qualification via le SDK FFTA Modules.",
  "readonly": "Le mode lecture seule est actif. La modification des scores est désactivée.",
  "sections": {
    "scores": "Scores de qualification",
    "edit": "Modifier le score sélectionné"
  },
  "fields": {
    "score": "Score"
  },
  "table": {
    "name": "Archer",
    "club": "Club",
    "target": "Cible",
    "score": "Score"
  },
  "actions": {
    "select": "Sélectionner",
    "save": "Enregistrer le score",
    "saving": "Enregistrement…"
  },
  "messages": {
    "readonly": "Vous n'avez pas les droits d'écriture.",
    "invalidScore": "Le score est invalide.",
    "saved": "Score enregistré.",
    "saveFailed": "Impossible d'enregistrer le score."
  },
  "empty": {
    "title": "Aucun score",
    "description": "Aucun score de qualification n'est disponible pour ce scénario."
  }
}
```

---

## B11. Create `README.md`

```md
# MVVM Score Editor

This module demonstrates a full MVVM structure for FFTA Modules SDK.

It includes:

- manifest declaration;
- ACL read/write checks;
- score reading;
- score writing;
- ViewModel state;
- Lab certification.
```

---

## B12. Register the MVVM module in the Lab

If required by your current Lab version, add the manifest to the Lab registry:

```js
import mvvmScoreEditorManifest from '../../modules/mvvm-score-editor/module.manifest.js';
```

Then add it to the list:

```js
const manifests = [
  mvvmScoreEditorManifest
];
```

---

# PART C — Tests to perform in the Lab

## C1. Functional tests

| Test | Expected result |
| --- | --- |
| Load module with ACL `admin` | Scores are displayed. |
| Select a row | The score input is populated. |
| Save score | Notification success appears. |
| Switch ACL to `read-only` | Save button is disabled. |
| Try write in read-only | Write is denied cleanly. |
| API mode `slow` | Loading state is visible. |
| API mode `offline` | Error message is displayed. |
| Scenario `empty` | Empty state is displayed. |
| Scenario `generated competition` | Generated scores are displayed. |
| Language `fr` | French text is displayed. |
| Device `mobile` | Table/page remains usable. |

---

## C2. Certification tests

In the Lab:

1. Select the module.
2. Click **Run certification**.
3. Read the report.
4. Fix all errors.
5. Re-run certification.

Common errors:

| Error | Fix |
| --- | --- |
| Missing `access.subFeature` | Add `access.subFeature` in manifest. |
| Missing i18n files | Add `i18n/en.json` and `i18n/fr.json`. |
| Invalid simple action | Check `handler.service`, `handler.method`, and `permission`. |
| Write action in read-only mode | Add `permission: 'write'` and use `data-requires-write` in UI. |
| Console error | Fix runtime error before certification. |

---

## C3. Manual certification checklist

Before shipping a module:

- [ ] Module has a unique `id`.
- [ ] Manifest has `sdkVersion`.
- [ ] Manifest has `runtimeCompatibility` including `ianseo` and ideally `lab`.
- [ ] Manifest has ACL config.
- [ ] Every visible string uses i18n.
- [ ] Read actions work in read-only mode.
- [ ] Write actions are disabled in read-only mode.
- [ ] Write APIs still check ACL server-side.
- [ ] Module works in French and English.
- [ ] Module works in dark theme.
- [ ] Module works in mobile frame.
- [ ] Module handles empty data.
- [ ] Module handles API errors.
- [ ] Lab certification passes.

---

# PART D — AI agent instructions

Use this section as a prompt for Codex, Claude Code or another coding agent.

## D1. Prompt for a simple module

```txt
Create a new FFTA Modules SDK simple module named "Simple Score Editor".

Constraints:
- Use English for file names, variable names and comments.
- Use i18n for all user-facing strings.
- Create the module in modules/simple-score-editor/.
- Use type: 'simple' in module.manifest.js.
- Add ACL with acl: 'AclModules', subFeature: 'simpleScoreEditor', read: 'AclReadOnly', write: 'AclReadWrite'.
- Add one read action that calls app.data.scores.listQualificationScores with session: 1.
- Add one write action that calls app.data.scores.saveQualificationScore with quId: 101 and score: 315.
- Add i18n/en.json and i18n/fr.json.
- Add README.md.
- Register the module in the Lab if the current Lab implementation requires static registration.
- Run syntax checks.
- Verify the module in Lab with admin, read-only and no-access ACL profiles.
- Run Lab certification and fix all errors.
```

## D2. Prompt for an MVVM module

```txt
Create a new FFTA Modules SDK MVVM module named "MVVM Score Editor".

Constraints:
- Use English for file names, variable names and comments.
- Use i18n for all user-facing strings.
- Create the module in modules/mvvm-score-editor/.
- Follow the file structure:
  - application/score-editor.store.js
  - application/score-editor.vm.js
  - domain/score.service.js
  - ui/ScoreEditorView.js
  - i18n/en.json
  - i18n/fr.json
  - module.manifest.js
  - module.mount.js
  - module.routes.js
  - README.md
- The module must read qualification scores through app.data.scores.listQualificationScores({ session: 1 }, { moduleId }).
- The module must save scores through app.data.scores.saveQualificationScore({ quId, score }, { moduleId }).
- The ViewModel must check app.acl.canWrite(moduleId) and expose readonly state.
- The UI must disable all write controls in readonly mode and mark them with data-requires-write.
- The UI must show loading, empty and error states.
- Register the module in the Lab if the current Lab implementation requires static registration.
- Test with admin, read-only, no-access, slow API, offline API, empty data and generated competition.
- Run Lab certification and fix all errors.
```

---

# PART E — Troubleshooting

## The module is not visible in the Lab

Check:

- the module is registered in the Lab registry if required;
- `runtimeCompatibility` includes `lab`;
- `id` is unique;
- the manifest imports without syntax errors.

## The write button works in read-only mode

Fix:

- add `permission: 'write'` in simple module actions;
- use `app.acl.canWrite(moduleId)` in MVVM;
- add `data-requires-write` to write buttons;
- call `app.ui.setReadonlyMode(root, state.readonly)`;
- ensure the API call uses `{ moduleId }` so ACL is checked for the correct module.

## Scores do not display

Check:

- the selected Lab scenario contains scores;
- the API mode is not `offline`;
- the method name is `listQualificationScores` or `readQualificationScores`;
- the payload uses a valid session, for example `{ session: 1 }`.

## Certification fails because of ACL

Check:

```js
access: {
  acl: 'AclModules',
  subFeature: 'myStableSubFeatureName',
  read: 'AclReadOnly',
  write: 'AclReadWrite'
}
```

Do not generate a random `subFeature`; it must remain stable across versions.

---

# PART F — Recommended development workflow

Use this loop:

```txt
1. Create module folder
2. Write manifest
3. Write i18n files
4. Register in Lab
5. Run Lab
6. Test admin/read-only/no-access
7. Test normal/slow/offline API
8. Test empty/generated data
9. Run certification
10. Fix errors
11. Test in real Ianseo
```

Do not start on a real Ianseo first. The Lab exists to catch the boring bugs before they become dramatic bugs. Very noble work for a fake tournament.
