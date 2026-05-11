export function createInitialLeagueState() {
  return {
    isLoading: false,
    error: null,
    settings: null,
    standings: [],
    warnings: [],
    calculatedAt: null
  };
}
