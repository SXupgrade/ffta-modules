export default {
  sdkVersion: '1.0.0',
  id: 'assistant',
  audience: 'organizer',
  name: 'Assistant',
  version: '0.1.0',
  description: 'Organizer checklist assistant for before, during and after archery tournaments',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/assistant.css'],
  capabilities: ['i18n', 'routing', 'data:read', 'storage'],
  runtimeCompatibility: ['ianseo', 'lab'],
  access: {
    acl: 'AclModules',
    subFeature: 'fftaAssistant',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  creator: {
    name: 'Xavier Michaux',
    role: 'Creator',
    note: 'Organizer assistant concept and module ownership'
  },
  contributors: [
    { name: 'OpenAI / ChatGPT', role: 'Implementation assistant', note: 'Checklist assistant implementation' }
  ],
  acknowledgements: [
    { name: 'FFTA community', reason: 'Domain feedback, real competition workflows and field needs' }
  ],
  navigation: { accentColor: '#7c3aed', order: 10 },
  settings: []
};
