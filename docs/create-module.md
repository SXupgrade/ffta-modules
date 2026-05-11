# Create a Module

## Minimum required files

```
modules/my-module/
  module.manifest.js
  module.mount.js
  i18n/
    en.json
    fr.json
  README.md
```

## Recommended structure

```
modules/my-module/
  module.manifest.js
  module.mount.js
  module.routes.js
  domain/
    my-module.rules.js
    my-module.points.js (if applicable)
    constants/
  application/
    my-module.store.js
    my-module.vm.js
    useCases/
    state/
  ui/
    pages/
    components/
    styles/
  repositories/
    my-module.repository.contract.js
    ianseo/
  i18n/
    en.json
    fr.json
  tests/
    fixtures/
  README.md
  CHANGELOG.md
```

## Step-by-step

### 1. Create the manifest

```js
// modules/my-module/module.manifest.js
export default {
  sdkVersion: '1.0.0',
  id: 'my-module',
  name: 'My Module',
  version: '0.1.0',
  entry: './module.mount.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  runtimeCompatibility: ['ianseo']
};
```

### 2. Create the mount function

```js
// modules/my-module/module.mount.js
import en from './i18n/en.json' assert { type: 'json' };
import fr from './i18n/fr.json' assert { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('my-module', { en, fr });

  app.menu.register({
    id: 'my-module',
    label: app.t('my-module.navigation.title'),
    route: '/my-module'
  });

  return {};
}
```

### 3. Add i18n files

All user-visible strings must go through i18n — never hardcode French labels in JS/PHP components.

```json
// i18n/en.json
{ "navigation": { "title": "My Module" } }
```

```json
// i18n/fr.json
{ "navigation": { "title": "Mon module" } }
```

### 4. Register the module

In `main.js`, import the manifest and mount function then call `loadModule`:

```js
import myManifest from './modules/my-module/module.manifest.js';
import { mountModule as mountMyModule } from './modules/my-module/module.mount.js';

await loadModule({ manifest: myManifest, mountModule: mountMyModule, app, registry });
```

## Rules

- Use only the public Module API (`app.*`). Never import private internals.
- Domain logic must be pure: no fetch, no DOM, no SQL.
- UI components return HTML strings; actions are handled by the ViewModel.
- Settings are declared in the manifest and accessed through `app.settings`.
- All user-facing text goes through `app.t(key)`.
