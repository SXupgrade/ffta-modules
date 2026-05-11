import { createInitialLeagueState } from './state/initialState.js';

export function createLeagueStore() {
  const state = createInitialLeagueState();
  const listeners = new Set();

  function notify() {
    for (const fn of listeners) fn(state);
  }

  return {
    state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    setLoading(value) {
      state.isLoading = Boolean(value);
      notify();
    },
    setError(error) {
      state.error = error;
      notify();
    },
    setSettings(settings) {
      state.settings = settings;
      notify();
    },
    setStandings(groups) {
      state.standings = groups;
      notify();
    },
    setWarnings(warnings) {
      state.warnings = warnings;
      notify();
    },
    setCalculatedAt(calculatedAt) {
      state.calculatedAt = calculatedAt;
      notify();
    }
  };
}
