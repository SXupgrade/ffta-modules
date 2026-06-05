export function createFeatureVm({ app, moduleId }) {
  const state = { loading: false, rows: [], error: null };
  return {
    state,
    async load() {
      state.loading = true;
      state.error = null;
      try {
        state.rows = await app.data.entries.list({}, { moduleId });
      } catch (error) {
        state.error = error.message;
        app.logger.error('Feature load failed', error);
      } finally {
        state.loading = false;
      }
    }
  };
}
