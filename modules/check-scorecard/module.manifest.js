export default {
  sdkVersion: '1.0.0',
  id: 'check-scorecard',
  audience: 'organizer',
  name: 'Check Scorecard',
  version: '0.1.0',
  description: 'Scorecard control panel for qualification distances and QuConfirm state.',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/check-scorecard.css'],
  capabilities: ['i18n', 'routing', 'data'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclQualification',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#2563eb', order: 35 },
  creator: {
    name: 'FFTA Modules',
    role: 'Module integration'
  }
};
