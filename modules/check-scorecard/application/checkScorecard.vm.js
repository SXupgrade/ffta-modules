export function createCheckScorecardViewModel({ app, store, repository }) {
  async function initialize() {
    store.setState({ loading: true, error: null });
    try {
      const payload = await repository.getInitialData();
      const firstSession = payload.sessions[0]?.id ? String(payload.sessions[0].id) : '';
      store.setState({
        context: payload.context,
        sessions: payload.sessions,
        filters: { session: firstSession },
        loading: false
      });
      if (firstSession) await loadRows();
    } catch (error) {
      store.setState({ loading: false, error: error.message || app.t('check-scorecard.error.load') });
    }
  }

  function setFilter(key, value) {
    const state = store.getState();
    store.setState({ filters: { ...state.filters, [key]: value } });
  }

  async function loadRows() {
    const state = store.getState();
    store.setState({ loading: true, error: null });
    try {
      const rows = await repository.listRows(state.filters);
      store.setState({ rows, loading: false });
    } catch (error) {
      store.setState({ loading: false, error: error.message || app.t('check-scorecard.error.load') });
    }
  }

  async function setConfirm({ rowId, distance, confirmed }) {
    const key = `${rowId}:${distance}`;
    const state = store.getState();
    const savingKeys = new Set(state.savingKeys);
    savingKeys.add(key);
    store.setState({ savingKeys, error: null });

    try {
      const updated = await repository.setConfirm({ id: rowId, distance, confirmed });
      const rows = store.getState().rows.map((row) => String(row.id) === String(rowId) ? updated : row);
      const nextSavingKeys = new Set(store.getState().savingKeys);
      nextSavingKeys.delete(key);
      store.setState({ rows, savingKeys: nextSavingKeys });
      app.notify.success(app.t(confirmed ? 'check-scorecard.message.confirmed' : 'check-scorecard.message.unconfirmed'));
    } catch (error) {
      const nextSavingKeys = new Set(store.getState().savingKeys);
      nextSavingKeys.delete(key);
      store.setState({ savingKeys: nextSavingKeys, error: error.message || app.t('check-scorecard.error.save') });
    }
  }

  return { initialize, setFilter, loadRows, setConfirm, subscribe: store.subscribe };
}
