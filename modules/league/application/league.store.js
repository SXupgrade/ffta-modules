import { createInitialLeagueState } from './state/initialState.js';

export function createLeagueStore() {
  const state = createInitialLeagueState();

  return {
    state,
    setLoading(value) {
      state.isLoading = Boolean(value);
    },
    setError(error) {
      state.error = error;
    },
    setSettings(settings) {
      state.settings = settings;
    },
    setStandings(groups) {
      state.standings = groups;
    },
    setWarnings(warnings) {
      state.warnings = warnings;
    },
    setCalculatedAt(calculatedAt) {
      state.calculatedAt = calculatedAt;
    }
  };
}
