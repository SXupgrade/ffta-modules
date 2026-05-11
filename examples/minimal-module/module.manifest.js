export default {
  sdkVersion: '1.0.0',
  id: 'minimal-module',
  name: 'Minimal Module',
  version: '0.1.0',
  description: 'A minimal reference module showing the essential structure',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  capabilities: ['settings', 'i18n', 'routing'],
  runtimeCompatibility: ['ianseo'],
  settings: [
    { key: 'minimal-module.greeting', type: 'string', defaultValue: 'Hello' }
  ]
};
