export default {
  sdkVersion: '1.0.0',
  id: 'league',
  name: 'Team Championship',
  version: '0.1.0',
  entry: './module.mount.js',
  routes: './module.routes.js',
  i18n: ['./i18n/en.json', './i18n/fr.json'],
  styles: ['./ui/styles/league.css'],
  capabilities: ['settings', 'i18n', 'routing', 'export', 'pdf'],
  runtimeCompatibility: ['ianseo'],
  settings: [
    { key: 'league.masterTournamentCode', type: 'string', defaultValue: '' },
    { key: 'league.roundTournamentCodes', type: 'array', defaultValue: [] },
    { key: 'league.groupBy', type: 'string', defaultValue: 'division-class' },
    { key: 'league.qualificationPointsGrid', type: 'array', defaultValue: [] },
    { key: 'league.matchPointsMode', type: 'string', defaultValue: 'match-wins' },
    { key: 'league.matchWinPoints', type: 'number', defaultValue: 1 },
    { key: 'league.bracketPointsGrid', type: 'array', defaultValue: [] }
  ]
};
