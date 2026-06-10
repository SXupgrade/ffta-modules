export default {
  sdkVersion: '1.0.0',
  id: 'league',
  name: 'Championnat par équipe',
  version: '0.1.0',
  description: 'Team league standings and points aggregation module',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/league.css'],
  capabilities: ['settings', 'i18n', 'routing', 'export', 'pdf'],
  runtimeCompatibility: ['ianseo'],
  access: {
    acl: 'AclModules',
    subFeature: 'fftaLeague',
    read: 'AclReadOnly',
    write: 'AclReadWrite'
  },
  creator: {
    name: 'Xavier / Compet+',
    role: 'Creator',
    note: 'Concept, product direction and module ownership'
  },
  contributors: [
    { name: 'OpenAI / ChatGPT', role: 'Implementation assistant', note: 'Team league module implementation' }
  ],
  acknowledgements: [
    { name: 'FFTA community', reason: 'Domain feedback, real competition workflows and field needs' }
  ],
  navigation: { accentColor: '#4338ca' },
  settings: [
    { key: 'league.masterTournamentCode', type: 'string', defaultValue: '' },
    { key: 'league.roundTournamentCodes', type: 'array', defaultValue: [] },
    { key: 'league.groupBy', type: 'string', defaultValue: 'division-class' },
    { key: 'league.qualificationPointsGrid', type: 'array', defaultValue: [] },
    { key: 'league.matchPointsMode', type: 'string', defaultValue: 'match-wins' },
    { key: 'league.matchWinPoints', type: 'number', defaultValue: 1 },
    { key: 'league.bracketPointsGrid', type: 'array', defaultValue: [] },
    { key: 'league.pointsMode', type: 'string', defaultValue: 'qualification-ranking' }
  ]
};
