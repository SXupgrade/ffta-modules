export default {
  sdkVersion: '1.0.0',
  id: 'achievements',
  name: 'Achievements',
  version: '0.1.0',
  description: 'Organizer achievements proof of concept for Compet+ and FFTA Modules usage milestones',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/achievements.css'],
  capabilities: ['i18n', 'routing', 'data:read'],
  runtimeCompatibility: ['ianseo', 'lab'],
  access: {
    acl: 'AclModules',
    subFeature: 'fftaAchievements',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#ffffff' },
  settings: []
};
