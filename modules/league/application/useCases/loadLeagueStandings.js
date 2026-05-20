export async function loadLeagueStandings({ app, store, repository, calculator }) {
  store.setLoading(true);
  try {
    const input = await repository.getLeagueInput();
    const result = calculator.calculateStandings(input);
    store.setSettings(input.settings);
    store.setMasterTournament(input.masterTournament ?? null);
    store.setAvailableTournaments(input.availableTournaments ?? []);
    store.setRounds(input.rounds ?? []);
    store.setStandings(result.groups);
    store.setWarnings(result.warnings);
    store.setCalculatedAt(result.calculatedAt);
    return result;
  } catch (error) {
    store.setError(error);
    app.notify.error(app.t('league.errors.loadFailed'));
    throw error;
  } finally {
    store.setLoading(false);
  }
}
