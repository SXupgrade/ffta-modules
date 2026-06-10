export default {
  sdkVersion: '1.0.0',
  id: 'earchery',
  name: 'eArchery',
  version: '0.1.0',
  description: 'Simple archery arcade proof of concept with a moving target and click-to-shoot scoring',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/earchery.css'],
  capabilities: ['i18n', 'routing'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclModules',
    subFeature: 'fftaEArchery',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#ffffff' },
  settings: []
};
