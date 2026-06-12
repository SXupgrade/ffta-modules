export default {
  sdkVersion: '1.0.0',
  id: 'export-ffta',
  audience: 'organizer',
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
  creator: {
    name: 'Xavier / Compet+',
    role: 'Creator',
    note: 'FFTA export workflow and module ownership'
  },
  contributors: [
    { name: 'OpenAI / ChatGPT', role: 'Implementation assistant', note: 'Export module implementation' }
  ],
  acknowledgements: [
    { name: 'FFTA community', reason: 'Domain feedback, real competition workflows and field needs' }
  ],
  navigation: { accentColor: '#2563eb', order: 60 },
  settings: [
    { key: 'export-ffta.defaultLevel', type: 'string', defaultValue: 'S' }
  ]
};
