export default {
  sdkVersion: '1.0.0',
  id: 'bslt',
  name: 'Saisie Beursault',
  version: '0.1.0',
  description: 'Legacy Beursault score entry module',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/bslt.css'],
  capabilities: ['routing', 'legacy-ianseo'],
  runtimeCompatibility: ['ianseo'],
  navigation: { accentColor: '#00a3e0' },
  settings: []
};
