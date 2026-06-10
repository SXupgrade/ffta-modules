export function createBeursaultStore() {
  let state = {
    context: null,
    sessions: [],
    filters: { session: '', fromTarget: '', toTarget: '' },
    rows: [],
    loading: false,
    savingIds: new Set(),
    error: null
  };

  const listeners = new Set();

  const getState = () => ({
    ...state,
    savingIds: new Set(state.savingIds)
  });

  const setState = (patch) => {
    state = { ...state, ...patch };
    const nextState = getState();
    for (const listener of listeners) listener(nextState);
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    listener(getState());
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
}
