export default {
  sdkVersion: '1.0.0',
  id: 'prints',
  name: 'Impressions',
  version: '0.1.0',
  description: 'Legacy print helper module',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/prints.css'],
  capabilities: ['routing', 'legacy-ianseo'],
  runtimeCompatibility: ['ianseo'],
  navigation: { accentColor: '#ff7a00' },
  settings: []
};
