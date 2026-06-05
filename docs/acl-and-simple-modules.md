# ACL and simple modules

## ACL contract

Every module can declare an `access` block in its manifest:

```js
access: {
  acl: 'AclModules',
  subFeature: 'fftaExport',
  read: 'AclReadOnly',
  write: 'AclReadWrite'
}
```

The shell resolves access through `api/acl.php` and exposes it with:

```js
await app.acl.canRead(manifestOrModuleId);
await app.acl.canWrite(manifestOrModuleId);
app.acl.canReadCached(moduleId);
app.acl.canWriteCached(moduleId);
app.acl.requireWrite(moduleId);
```

Access levels are:

- `none`: the module is hidden from navigation.
- `read`: the module is visible, write actions must be disabled.
- `write`: full access.

Server APIs must still call `ffta_acl_require($access, 'read')` or `ffta_acl_require($access, 'write')` before returning or changing data.
Client checks are UX only; PHP checks are authoritative.

## Simple manifest-only modules

A simple module does not need `module.mount.js`, routes, VM or page components. The shell builds a standard page from the manifest.

```js
export default {
  sdkVersion: '1.1.0',
  type: 'simple',
  id: 'simple-scores',
  name: 'Simple Scores',
  version: '0.1.0',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclModules',
    subFeature: 'simpleScores',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  page: {
    titleKey: 'simple-scores.title',
    descriptionKey: 'simple-scores.description',
    actions: [
      {
        id: 'readScores',
        labelKey: 'simple-scores.actions.readScores',
        permission: 'read',
        handler: {
          service: 'scores',
          method: 'readQualificationScores',
          payload: {}
        }
      }
    ]
  }
};
```

Available common data services:

```js
app.data.tournament.getCurrent();
app.data.entries.list({ session: 1 });
app.data.scores.readQualificationScores({ session: 1 });
app.data.scores.writeQualificationScore({ qualificationId: 123, distance: 'D1', score: 280 });
app.data.targets.list({ session: 1 });
```

The simple mode is intended for small utility modules. If a module needs advanced UI state, tables with custom interactions or complex workflows, keep using MVVM.

## FFTA Modules Lab

The SDK now ships with `lab/`, a local Ianseo simulator for module development.

It is designed to validate SDK contracts before installing a module into a real Ianseo instance:

- manifest loading;
- ACL modes (`none`, `read`, `write`);
- simple manifest-only modules;
- `app.data` calls with mock tournament data;
- i18n loading;
- API delay and API error scenarios.

Run it with:

```bash
cd lab
npm install
npm run dev
```

Then add or edit module declarations in `lab/index.html`.

The lab intentionally does not replace final testing in Ianseo. It catches SDK-level issues earlier and makes module iteration much faster.
