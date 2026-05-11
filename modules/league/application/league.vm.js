import { loadLeagueStandings } from './useCases/loadLeagueStandings.js';
import { recalculateLeague } from './useCases/recalculateLeague.js';
import { saveLeagueSettings } from './useCases/saveLeagueSettings.js';
import { exportLeagueResults } from './useCases/exportLeagueResults.js';

export function createLeagueViewModel({ app, store, repository, calculator }) {
  return {
    state: store.state,
    async load() {
      return loadLeagueStandings({ app, store, repository, calculator });
    },
    async recalculate() {
      return recalculateLeague({ app, store, repository, calculator });
    },
    async saveSettings(settings) {
      return saveLeagueSettings({ app, store, repository, settings });
    },
    async exportPdf() {
      return exportLeagueResults({ app, store, format: 'pdf' });
    }
  };
}
