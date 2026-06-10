export default {
  sdkVersion: '1.0.0',
  id: 'toss',
  name: 'Toss',
  version: '0.1.0',
  description: 'Provably fair random toss and draw module for competition decisions',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/toss.css'],
  capabilities: ['i18n', 'routing', 'export'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclModules',
    subFeature: 'fftaToss',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#ffffff' },
  settings: []
};
