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
  creator: {
    name: 'Xavier / Compet+',
    role: 'Creator',
    note: 'Organizer achievements concept and module ownership'
  },
  contributors: [
    { name: 'OpenAI / ChatGPT', role: 'Implementation assistant', note: 'Achievements engine implementation' }
  ],
  acknowledgements: [
    { name: 'FFTA community', reason: 'Domain feedback, real competition workflows and field needs' }
  ],
  navigation: { accentColor: '#f59e0b' },
  settings: []
};
