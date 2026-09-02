import { loadGdprStatus } from './useCases/loadGdprStatus.js';
import { previewGdprPublish } from './useCases/previewGdprPublish.js';
import { publishGdprResults } from './useCases/publishGdprResults.js';
import { loadGdprParticipants } from './useCases/loadGdprParticipants.js';
import { setGdprParticipantOptOut } from './useCases/setGdprParticipantOptOut.js';

export function createGdprViewModel({ app, store, repository }) {
  store.state.__store = store;

  return {
    state: store.state,
    async load() {
      return loadGdprStatus({ app, store, repository });
    },
    async preview(selection) {
      return previewGdprPublish({ app, store, repository, selection });
    },
    async publish(selection) {
      return publishGdprResults({ app, store, repository, selection });
    },
    clearPreview() {
      store.setPreview(null);
    },
    setTab(tab) {
      store.setTab(tab);
      // Lazy per-tab loading, same rationale as export-ffta's own tabs: no
      // point fetching the participants list or the events/status data for
      // Publication internet before the organizer ever looks at that tab.
      if (tab === 'participants' && !store.state.participants.length && !store.state.isLoadingParticipants) {
        this.loadParticipants().catch(() => {});
      }
      if (tab === 'publish' && !store.state.tournamentId && !store.state.isLoading) {
        this.load().catch(() => {});
      }
    },
    async loadParticipants() {
      return loadGdprParticipants({ app, store, repository });
    },
    async setParticipantOptOut(entryId, optOut) {
      return setGdprParticipantOptOut({ app, store, repository, entryId, optOut });
    }
  };
}
