export default {
  sdkVersion: '1.0.0',
  id: 'rulebook',
  name: 'Rule Book',
  version: '0.1.0',
  description: 'Lightweight searchable FFTA rule book companion with chapter index, quick rules and official PDF link',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/rulebook.css'],
  capabilities: ['i18n', 'routing', 'storage'],
  runtimeCompatibility: ['ianseo', 'lab'],
  access: {
    acl: 'AclModules',
    subFeature: 'fftaRulebook',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  creator: {
    name: 'Xavier / Compet+',
    role: 'Creator',
    note: 'Rule Book companion concept and module ownership'
  },
  contributors: [
    { name: 'OpenAI / ChatGPT', role: 'Implementation assistant', note: 'Lightweight searchable rule book implementation' }
  ],
  acknowledgements: [
    { name: 'FFTA community', reason: 'Domain feedback, real competition workflows and field needs' }
  ],
  navigation: { accentColor: '#475569' },
  settings: []
};
