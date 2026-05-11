export function createDefaultLeagueSettings() {
  return {
    masterTournamentCode: '',
    roundTournamentCodes: [],
    groupBy: 'division-class',
    qualificationPointsGrid: [],
    matchPointsMode: 'match-wins',
    matchWinPoints: 1,
    bracketPointsGrid: []
  };
}
