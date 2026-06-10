const STORAGE_KEY = 'ffta.toss.history.v1';

export function createTossStore({ storage } = {}) {
  let state = {
    mode: 'coin',
    label: '',
    optionsText: 'Heads\nTails',
    current: null,
    history: readHistory(storage),
    isBusy: false,
    error: null,
    proofText: ''
  };
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(patch) {
    state = { ...state, ...patch };
    if (Object.prototype.hasOwnProperty.call(patch, 'history')) {
      writeHistory(storage, state.history);
    }
    for (const listener of listeners) listener(state);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}

function readHistory(storage) {
  try {
    const raw = storage?.getItem ? storage.getItem(STORAGE_KEY) : globalThis.localStorage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(storage, history) {
  try {
    const raw = JSON.stringify(Array.isArray(history) ? history : []);
    if (storage?.setItem) storage.setItem(STORAGE_KEY, raw);
    else globalThis.localStorage?.setItem(STORAGE_KEY, raw);
  } catch {}
}
