const STORAGE_KEY = 'ffta.rulebook.state.v1';

const DEFAULT_STATE = {
  query: '',
  selectedDiscipline: 'all',
  selectedSectionId: 'general',
  selectedEntryId: null,
  favorites: [],
  showOnlyFavorites: false
};

export function createRulebookStore({ storage } = {}) {
  let state = loadState(storage);
  const listeners = new Set();

  function getState() { return state; }

  function setState(patch) {
    state = { ...state, ...patch };
    saveState(storage, state);
    for (const listener of listeners) listener(state);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}

function loadState(storage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(storage, state) {
  try {
    const serialized = JSON.stringify(state);
    if (storage?.setItem) storage.setItem(STORAGE_KEY, serialized);
    else localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Storage is optional in embedded Ianseo contexts.
  }
}
