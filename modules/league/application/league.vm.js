import { loadLeagueStandings } from './useCases/loadLeagueStandings.js';
import { recalculateLeague } from './useCases/recalculateLeague.js';
import { saveLeagueSettings } from './useCases/saveLeagueSettings.js';
import { exportLeagueResults } from './useCases/exportLeagueResults.js';

export function createLeagueViewModel({ app, store, repository, calculator }) {
  // Expose the store reference on state so the page can subscribe.
  // The double-underscore prefix marks it as non-domain state.
  store.state.__store = store;

  return {
    state: store.state,
    async load() {
      return loadLeagueStandings({ app, store, repository, calculator });
    },
    async recalculate() {
      return recalculateLeague({ app, store, repository, calculator });
    },
    async saveSettings(settings) {
      await saveLeagueSettings({ app, store, repository, settings });
      return loadLeagueStandings({ app, store, repository, calculator });
    },
    async listTournaments() {
      if (typeof repository.listTournaments !== 'function') return [];
      try {
        return await repository.listTournaments();
      } catch {
        return [];
      }
    },
    async exportPdf() {
      return exportLeagueResults({ app, store, format: 'pdf' });
    },
    async exportCsv() {
      return exportLeagueResults({ app, store, format: 'csv' });
    }
  };
}
