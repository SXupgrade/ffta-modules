export default {
  sdkVersion: '1.0.0',
  id: 'rule-builder',
  audience: 'organizer',
  name: 'Rule Builder',
  version: '0.1.0',
  description: 'Exports the current tournament\'s configured ruleset (divisions, classes, events, distances, target faces, sessions) as a compet+-ready JSON template.',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/rule-builder.css'],
  capabilities: ['i18n', 'routing', 'ianseo-services'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclModules',
    subFeature: 'ruleBuilder',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#7c3aed', order: 65 }
};
