export default {
  sdkVersion: '1.0.0',
  id: 'export-ffta',
  name: 'Export FFTA',
  version: '0.1.0',
  description: 'Official French federation results export with non-regression checks.',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/export-ffta.css'],
  capabilities: ['i18n', 'routing', 'export', 'tnr'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclModules',
    subFeature: 'fftaExport',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#2563eb' },
  settings: [
    { key: 'export-ffta.defaultLevel', type: 'string', defaultValue: 'S' }
  ]
};
