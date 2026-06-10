export default {
  sdkVersion: '1.0.0',
  id: 'records',
  name: 'Records Manager',
  version: '0.2.1',
  description: 'Global records catalog, tournament snapshot activation and broken records viewer for Ianseo-compatible tables',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/records.css'],
  capabilities: ['settings', 'i18n', 'routing', 'export'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclModules',
    subFeature: 'fftaRecords',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#ffffff' },
  settings: [
    { key: 'records.defaultAreaCode', type: 'string', defaultValue: 'FFTA' },
    { key: 'records.defaultAreaName', type: 'string', defaultValue: 'FFTA Records' }
  ]
};
