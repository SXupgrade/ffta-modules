export default {
  sdkVersion: '1.1.0',
  id: 'developer-wiki',
  name: 'Developer Wiki',
  version: '0.1.0',
  description: 'Embedded step-by-step wiki for simple and MVVM module development with Lab certification workflow.',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/developer-wiki.css'],
  capabilities: ['i18n', 'routing', 'documentation', 'lab', 'certification'],
  runtimeCompatibility: ['ianseo', 'lab'],
  access: {
    acl: 'AclModules',
    subFeature: 'developerWiki',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#7c3aed' },
  metadata: {
    author: 'Compet+',
    license: 'MIT',
    category: 'developer-tools'
  }
};
