export function createPrintsAdapterStore() {
  let state = {
    isLoading: false,
    error: '',
    data: null,
    collapsedSections: new Set(['payments', 'equipment']),
    scorecardForm: {
      session: '',
      from: '',
      to: '',
      draw: 'Complete',
      barcode: true,
      filled: false,
      personalScore: false,
      noEmpty: true,
      distances: []
    }
  };

  const listeners = new Set();

  function getState() {
    return { ...state, __store: api };
  }

  function setState(patch) {
    state = { ...state, ...patch };
    for (const listener of listeners) listener(getState());
  }

  const api = {
    getState,
    setState,
    subscribe(listener) {
      listeners.add(listener);
      listener(getState());
      return () => listeners.delete(listener);
    }
  };

  return api;
}
