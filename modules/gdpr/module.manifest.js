export default {
  sdkVersion: '1.0.0',
  id: 'gdpr',
  audience: 'organizer',
  name: 'RGPD',
  version: '0.2.0',
  description: 'Manages per-archer RGPD opt-out, anonymized prints, and publishes results to ianseo.net with opted-out archers automatically anonymized',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/gdpr.css'],
  capabilities: ['i18n', 'routing', 'ianseo-services'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclInternetPublish',
    subFeature: 'ipSend',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#0f766e', order: 45 }
};
