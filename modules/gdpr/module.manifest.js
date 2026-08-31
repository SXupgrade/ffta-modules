export default {
  sdkVersion: '1.0.0',
  id: 'gdpr',
  audience: 'organizer',
  name: 'RGPD Publish',
  version: '0.1.0',
  description: 'Publishes results to ianseo.net with RGPD-opted-out archers automatically anonymized',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/gdpr.css'],
  capabilities: ['i18n', 'routing'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclInternetPublish',
    subFeature: 'ipSend',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#0f766e', order: 45 }
};
