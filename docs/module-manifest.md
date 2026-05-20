# Module Manifest

Every module must export a default manifest object from `module.manifest.js`.

## Required fields

| Field | Type | Description |
|---|---|---|
| `sdkVersion` | string | Platform SDK version this module targets (e.g. `'1.0.0'`) |
| `id` | string | Unique kebab-case module identifier (e.g. `'league'`) |
| `name` | string | Human-readable module name |
| `version` | string | Semver module version |
| `entry` | string | Relative path to `module.mount.js` |
| `runtimeCompatibility` | string[] | Runtimes supported, e.g. `['ianseo']` |

## Optional fields

| Field | Type | Description |
|---|---|---|
| `description` | string | Short description of the module |
| `routes` | string | Relative path to routes file |
| `i18n` | string[] | Relative paths to i18n JSON files (`en.json`, `fr.json`, …) |
| `styles` | string[] | Relative paths to CSS files |
| `capabilities` | string[] | Declared capabilities: `settings`, `i18n`, `routing`, `export`, `pdf` |
| `settings` | object[] | Settings schema: `{ key, type, defaultValue }` |
| `navigation` | object | Optional navigation metadata, e.g. `{ accentColor: '#e4007f' }` for the colored underline in the FFTA module bar |

## Example

```js
export default {
  sdkVersion: '1.0.0',
  id: 'my-module',
  name: 'My Module',
  version: '0.1.0',
  description: 'A community module example',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/my-module.css'],
  capabilities: ['settings', 'i18n', 'routing'],
  runtimeCompatibility: ['ianseo'],
  navigation: { accentColor: '#e4007f' },
  settings: [
    { key: 'my-module.someSetting', type: 'string', defaultValue: '' }
  ]
};
```

## Validation

The module loader validates required fields on load. Modules with invalid manifests are rejected with a readable error and do not block other modules from loading.

The `id` field must match the pattern `^[a-z0-9][a-z0-9-]*$` (kebab-case lowercase).
