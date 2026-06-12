export default {
  sdkVersion: '1.0.0',
  id: 'prints-adapter',
  audience: 'organizer',
  name: 'Prints Adapter',
  version: '0.1.0',
  description: 'Ianseo print helpers exposed through the shared AppIanseo adapter facade.',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/prints-adapter.css'],
  capabilities: ['i18n', 'routing', 'ianseo-services'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclModules',
    subFeature: 'fftaPrintsAdapter',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#2563eb', order: 20 },
  creator: {
    name: 'FFTA Modules',
    url: 'https://github.com/SXupgrade'
  },
  contributors: [
    { name: 'Inspired by the legacy Prints module' }
  ]
};
