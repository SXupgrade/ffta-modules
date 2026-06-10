export default {
  sdkVersion: '1.0.0',
  id: 'beursault',
  name: 'Beursault Scores',
  version: '0.1.0',
  description: 'Dedicated Beursault score entry: honours first, then points, 4s and 3s.',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/beursault.css'],
  capabilities: ['i18n', 'routing', 'data'],
  runtimeCompatibility: ['ianseo'],
  tournament: {
    locSubRules: ['SetFrBeursault'],
    tourTypes: [50]
  },
  access: {
    acl: 'AclQualification',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#7c3aed' },
  creator: {
    name: 'FFTA Modules',
    role: 'Module integration'
  },
  acknowledgements: [
    { name: 'Bslt module authors', reason: 'Original Beursault scoring workflow inspiration' }
  ]
};
