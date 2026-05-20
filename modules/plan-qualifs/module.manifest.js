export default {
  sdkVersion: '1.0.0',
  id: 'plan-qualifs',
  name: 'Plan de cible — Qualifications',
  version: '1.0.0',
  description: 'Native qualification target plan module using the ffta-modules MVVM architecture and Ianseo repositories',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/plan-qualifs.css'],
  capabilities: ['routing', 'i18n', 'settings', 'ianseo-db', 'target-plan'],
  runtimeCompatibility: ['ianseo'],
  navigation: { accentColor: '#35b558' },
  settings: []
};
