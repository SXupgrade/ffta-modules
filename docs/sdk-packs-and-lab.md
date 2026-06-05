# SDK packs and FFTA Modules Lab

## Public SDK packs

The module context now exposes a broader but still MVP-friendly API surface:

```js
app.context.getTournament();
app.data.context.getCurrentUser();
app.acl.canRead(moduleId);
app.acl.canWrite(moduleId);
app.i18n.t('namespace.key');
app.notify.success('Saved');
app.logger.info('Loaded', payload);
```

### Archery data

```js
app.data.entries.list({ session: 1 });
app.data.entries.get(entryId);

app.data.scores.listQualificationScores({ session: 1 });
app.data.scores.getQualificationScore(entryId);
app.data.scores.saveQualificationScore({ quId: 101, distance: 'D1', score: 315 });

app.data.targets.list({ session: 1 });
app.data.targets.assign({ entryId: 101, session: 1, targetNo: '001A' });
app.data.targets.unassign({ entryId: 101 });

app.data.clubs.list();
app.data.divisions.list();
app.data.classes.list();
```

Write methods are guarded client-side by `app.acl` and server-side by `api/data.php`.

### UI helpers

```js
app.ui.renderCard({ title, body, actions });
app.ui.renderTable({ columns, rows });
app.ui.renderToolbar(actions);
app.ui.renderEmptyState({ title, detail });
app.ui.confirm({ title, message });
app.ui.openModal({ title, body, footer });
app.ui.setReadonlyMode(root, true);
```

### Files and exports

```js
app.files.downloadText('export.txt', content);
app.files.downloadJson('scores.json', scores);
app.files.readJsonFile(file);

app.exports.createTextExport({ filename: 'ffta.txt', content });
app.exports.validateFftaTxt(content);
```

### Validation

```js
app.validation.validateManifest(manifest);
app.validation.validateAcl(manifest);
app.validation.validateSimpleModule(manifest);
```

## Lab scenarios

The lab can switch between:

- ACL profiles: admin, read-only, mixed, no-access.
- API modes: normal, slow, error, random-error, offline.
- Data scenarios: standard, empty, large, invalid.
- Language: English/French.
- Theme: light/dark.
- Device frame: desktop/tablet/mobile.

## Templates

Starter templates live in `lab/templates`:

- `simple-readonly`
- `simple-readwrite`
- `export-helper`
- `mvvm-advanced`

## Dev mode

The SDK can be switched to a verbose development mode from `config/ffta-modules.config.js`.

Production default:

```js
export default {
  devMode: false,
  logLevel: 'warn',
  exposeGlobal: false,
  showBadge: false,
  logs: {
    runtime: false,
    modules: false,
    acl: false,
    data: false,
    api: false,
    i18n: false
  }
};
```

Development example:

```js
export default {
  devMode: true,
  logLevel: 'debug',
  exposeGlobal: true,
  showBadge: true,
  logs: {
    runtime: true,
    modules: true,
    acl: true,
    data: true,
    api: true
  }
};
```

When enabled, the SDK exposes `app.dev` and routes logs through `app.logger` with channel prefixes:

```js
app.logger.debug('Loading scores', { session: 1 }, 'data');
app.dev.isEnabled('acl');
```

If `exposeGlobal` is enabled, the runtime also exposes:

```js
window.__FFTA_APP__
window.__FFTA_DEV__
```

This is useful in the browser console while developing modules, but must stay disabled in production because it exposes internal runtime objects.

The Lab also has a **Dev mode** switch in the left panel. This lets developers enable verbose logs without editing the config file each time.
