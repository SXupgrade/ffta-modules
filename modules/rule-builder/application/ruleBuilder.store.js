export function createRuleBuilderStore() {
  const listeners = new Set();
  const state = {
    isLoading: false,
    isDownloading: false,
    status: null,
    error: null
  };
  state.__store = { subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
  function notify() { listeners.forEach((listener) => listener()); }
  return {
    state,
    set(partial) { Object.assign(state, partial); notify(); }
  };
}
