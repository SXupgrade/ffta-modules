export function createExportFftaStore() {
  const listeners = new Set();
  const state = {
    activeTab: 'export',
    level: 'S',
    expectedFile: 'active-S.txt',
    datasetFile: 'tae-selectif-valides.json',
    datasets: ['tae-selectif-valides.json', 'tae-selectif-para.json', 'salle-selectif.json'],
    isLoading: false,
    status: 'idle',
    report: null,
    error: null
  };
  state.__store = { subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
  function notify() { listeners.forEach((listener) => listener()); }
  return {
    state,
    set(partial) { Object.assign(state, partial); notify(); }
  };
}
