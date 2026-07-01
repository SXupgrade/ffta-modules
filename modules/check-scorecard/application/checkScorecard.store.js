export function createCheckScorecardStore() {
  let state = {
    context: null,
    sessions: [],
    filters: { session: '' },
    rows: [],
    loading: false,
    savingKeys: new Set(),
    error: null
  };

  const listeners = new Set();

  const getState = () => ({
    ...state,
    savingKeys: new Set(state.savingKeys)
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
