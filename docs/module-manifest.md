# Module manifest

Example:

```js
export default {
  sdkVersion: '1.0.0',
  id: 'league',
  name: 'Team Championship',
  version: '0.1.0',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/league.css'],
  capabilities: ['settings', 'i18n', 'routing', 'export', 'pdf'],
  runtimeCompatibility: ['ianseo']
};
```
