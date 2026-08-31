import { loadGdprStatus } from './useCases/loadGdprStatus.js';
import { previewGdprPublish } from './useCases/previewGdprPublish.js';
import { publishGdprResults } from './useCases/publishGdprResults.js';

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
    }
  };
}
