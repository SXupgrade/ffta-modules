export default {
  sdkVersion: '1.0.0',
  id: 'toss',
  audience: 'organizer',
  name: 'Toss',
  version: '0.1.0',
  description: 'Provably fair random toss and draw module for competition decisions',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/toss.css'],
  capabilities: ['i18n', 'routing', 'export'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclModules',
    subFeature: 'fftaToss',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  creator: {
    name: 'Xavier / Compet+',
    role: 'Creator',
    note: 'Provably fair Toss concept and module ownership'
  },
  contributors: [
    { name: 'OpenAI / ChatGPT', role: 'Implementation assistant', note: 'Secure random draw implementation' }
  ],
  acknowledgements: [
    { name: 'FFTA community', reason: 'Domain feedback, real competition workflows and field needs' }
  ],
  navigation: { accentColor: '#0891b2', order: 70 },
  settings: []
};
