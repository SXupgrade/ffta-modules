import { createInitialRecordsState } from './state/initialState.js';

export function createRecordsStore() {
  const state = createInitialRecordsState();
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
    setSaving(value) { patch({ isSaving: Boolean(value) }); },
    setError(error) { patch({ error }); },
    setData(data) {
      patch({
        tournament: data.tournament ?? null,
        areas: data.areas ?? [],
        monitoredRecords: data.monitoredRecords ?? [],
        recordCodes: data.recordCodes ?? [],
        globalRecords: data.globalRecords ?? [],
        records: data.records ?? [],
        brokenRecords: data.brokenRecords ?? [],
        warnings: data.warnings ?? [],
        updatedAt: new Date().toISOString()
      });
    },
    setImportPreview(preview) { patch({ importPreview: preview }); }
  };
}
