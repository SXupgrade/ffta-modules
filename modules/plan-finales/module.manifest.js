export default {
  sdkVersion: '1.0.0',
  id: 'plan-finales',
  name: 'Plan de cible — Finales',
  version: '0.1.0',
  description: 'Legacy finals target plan module',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/plan-finales.css'],
  capabilities: ['routing', 'legacy-ianseo'],
  runtimeCompatibility: ['ianseo'],
  navigation: { accentColor: '#e4007f' },
  settings: []
};
