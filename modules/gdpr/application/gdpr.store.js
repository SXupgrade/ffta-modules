import { createInitialGdprState } from './state/initialState.js';

export function createGdprStore() {
  const state = createInitialGdprState();
  const listeners = new Set();

  function notify() {
    for (const fn of listeners) fn(state);
  }

  function patch(values) {
    Object.assign(state, values);
    notify();
  }

  return {
    state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    patch,
    setLoading(value) { patch({ isLoading: Boolean(value) }); },
    setPublishing(value) { patch({ isPublishing: Boolean(value) }); },
    setError(error) { patch({ error }); },
    setStatus(data) {
      patch({
        tournamentId: data.tournamentId ?? null,
        optedOutCount: data.optedOutCount ?? 0,
        credentialsConfigured: Boolean(data.credentialsConfigured),
        events: data.events ?? { individual: [], team: [] }
      });
    },
    setPreview(preview) { patch({ preview }); },
    setLastResult(result) { patch({ lastResult: result }); }
  };
}
