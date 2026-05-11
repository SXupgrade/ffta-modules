export async function exportLeagueResults({ app, store, format }) {
  const filename = 'team-championship-standings.pdf';
  const documentModel = {
    title: app.t('league.title'),
    groups: store.state.standings,
    calculatedAt: store.state.calculatedAt
  };

  if (format === 'pdf') {
    return app.exports.pdf(filename, documentModel);
  }

  return app.exports.csv('team-championship-standings.csv', store.state.standings);
}
