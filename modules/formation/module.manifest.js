export default {
  sdkVersion: '1.0.0',
  id: 'formation',
  audience: 'organizer',
  name: 'Formation',
  version: '0.1.0',
  description: 'Guided Ianseo eLearning course based on the FFTA 2024 simplified tutorial with automatic checks on the active tournament.',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/formation.css'],
  capabilities: ['i18n', 'routing', 'ianseo-services', 'progress-tracking'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclCompetition',
    subFeature: 'fftaFormation',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  navigation: { accentColor: '#7c3aed', order: 12 },
  creator: { name: 'FFTA Modules', url: 'https://github.com/SXupgrade' },
  acknowledgements: [
    { name: 'FFTA simplified Ianseo tutorial', role: 'V1 pedagogical guideline' },
    { name: 'Ianseo official guides', role: 'Reference documentation' }
  ],
  contributors: [
    { name: 'Occitanie / CD reference documents', role: 'Complementary field practices' }
  ]
};
