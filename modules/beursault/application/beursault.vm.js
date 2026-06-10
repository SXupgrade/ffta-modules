import { computeBeursaultScore, deriveZoneCountsFromIanseo } from '../domain/beursault.score.js';

export function createBeursaultViewModel({ app, store, repository }) {
  async function initialize() {
    store.setState({ loading: true, error: null });
    try {
      const payload = await repository.getInitialData();
      store.setState({
        context: payload.context,
        sessions: payload.sessions,
        filters: {
          session: payload.sessions[0]?.id ? String(payload.sessions[0].id) : '',
          fromTarget: payload.sessions[0]?.firstTarget ? String(payload.sessions[0].firstTarget) : '',
          toTarget: payload.sessions[0]?.lastTarget ? String(payload.sessions[0].lastTarget) : ''
        },
        loading: false
      });
    } catch (error) {
      store.setState({ loading: false, error: error.message || app.t('beursault.error.load') });
    }
  }

  function setFilter(key, value) {
    const state = store.getState();
    const filters = { ...state.filters, [key]: value };

    if (key === 'session') {
      const session = state.sessions.find((item) => String(item.id) === String(value));
      if (session) {
        filters.fromTarget = String(session.firstTarget || '');
        filters.toTarget = String(session.lastTarget || '');
      }
    }

    store.setState({ filters });
  }

  async function loadRows() {
    const state = store.getState();
    store.setState({ loading: true, error: null });
    try {
      const rows = await repository.listScores(state.filters);
      store.setState({
        rows: rows.map((row) => ({ ...row, score: deriveZoneCountsFromIanseo(row) })),
        loading: false
      });
    } catch (error) {
      store.setState({ loading: false, error: error.message || app.t('beursault.error.load') });
    }
  }

  function updateRow(rowId, field, value) {
    const state = store.getState();
    const rows = state.rows.map((row) => {
      if (String(row.id) !== String(rowId)) return row;
      const score = computeBeursaultScore({ ...row.score, [field]: value });
      return { ...row, score };
    });
    store.setState({ rows });
  }

  async function saveRow(rowId) {
    const state = store.getState();
    const row = state.rows.find((item) => String(item.id) === String(rowId));
    if (!row || !row.score.valid) return;

    const savingIds = new Set(state.savingIds);
    savingIds.add(String(rowId));
    store.setState({ savingIds, error: null });

    try {
      const saved = await repository.saveScore({ id: row.id, ...row.score });
      const rows = store.getState().rows.map((item) => String(item.id) === String(rowId)
        ? { ...item, ...saved, score: deriveZoneCountsFromIanseo(saved) }
        : item);
      const nextSavingIds = new Set(store.getState().savingIds);
      nextSavingIds.delete(String(rowId));
      store.setState({ rows, savingIds: nextSavingIds });
      app.notify.success(app.t('beursault.saved'));
    } catch (error) {
      const nextSavingIds = new Set(store.getState().savingIds);
      nextSavingIds.delete(String(rowId));
      store.setState({ savingIds: nextSavingIds, error: error.message || app.t('beursault.error.save') });
    }
  }

  return { initialize, setFilter, loadRows, updateRow, saveRow, subscribe: store.subscribe };
}
