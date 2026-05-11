export function createTournamentService(adapter) {
  return {
    async getTournament() {
      return adapter.getTournament();
    }
  };
}
