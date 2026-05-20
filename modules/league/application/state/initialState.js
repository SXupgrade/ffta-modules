export function createInitialLeagueState() {
  return {
    isLoading: false,
    error: null,
    settings: null,
    masterTournament: null,
    availableTournaments: [],
    rounds: [],
    standings: [],
    warnings: [],
    calculatedAt: null
  };
}
