export default {
  sdkVersion: '1.0.0',
  id: 'minimal-module',
  name: 'Minimal Module',
  version: '0.2.0',
  description: 'A richer reference module showing manifest, mount, i18n, settings, MVVM and UI conventions.',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/minimal.css'],
  capabilities: ['settings', 'i18n', 'routing'],
  runtimeCompatibility: ['ianseo'],
  navigation: {
    accentColor: '#d64031'
  },
  settings: [
    { key: 'minimal-module.greeting', type: 'string', defaultValue: 'Hello from Minimal Module' }
  ]
};
