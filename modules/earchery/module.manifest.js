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
  creator: {
    name: 'Xavier / Compet+',
    role: 'Creator',
    note: 'eArchery PoC concept and module ownership'
  },
  contributors: [
    { name: 'OpenAI / ChatGPT', role: 'Implementation assistant', note: 'Arcade target PoC implementation' }
  ],
  acknowledgements: [
    { name: 'FFTA community', reason: 'Domain feedback, real competition workflows and field needs' }
  ],
  navigation: { accentColor: '#ea580c' },
  settings: []
};
