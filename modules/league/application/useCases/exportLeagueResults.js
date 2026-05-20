export async function exportLeagueResults({ app, store, format }) {
  const settings = store.state.settings ?? {};
  const rounds = buildRoundsFromSettings(settings);

  const filename = 'team-championship-standings.pdf';
  const documentModel = {
    title: app.t('league.title'),
    groups: store.state.standings,
    rounds,
    calculatedAt: store.state.calculatedAt,
    labels: {
      print: app.t('league.export.print'),
      calculated: app.t('league.export.calculated'),
      rank: app.t('league.standings.rank'),
      team: app.t('league.standings.team'),
      total: app.t('league.standings.total'),
      round: app.t('league.standings.round'),
      qualRank: app.t('league.standings.qualRank'),
      qualPts: app.t('league.standings.qualPts'),
      matchWins: app.t('league.standings.matchWins'),
      matchPts: app.t('league.standings.matchPts'),
      finalRank: app.t('league.standings.finalRank'),
      finalPts: app.t('league.standings.finalPts'),
      roundTotal: app.t('league.standings.roundTotal'),
      noTeams: app.t('league.standings.noTeams')
    }
  };

  if (format === 'pdf') {
    return app.exports.pdf(filename, documentModel);
  }

  return app.exports.csv('team-championship-standings.csv', store.state.standings);
}

function buildRoundsFromSettings(settings) {
  const codes = Array.isArray(settings.roundTournamentCodes)
    ? settings.roundTournamentCodes
    : [];

  return codes
    .filter((code) => String(code ?? '').trim() !== '')
    .map((code, index) => ({
      code: String(code).trim(),
      index: index + 1,
      name: String(code).trim()
    }));
}
