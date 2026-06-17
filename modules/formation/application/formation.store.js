const STORAGE_KEY = 'ffta.formation.state.v1';
const DEFAULT_STATE = { selectedLessonId: 'equipment', snapshot: null, progress: {}, exerciseInit: {}, exerciseCheck: {}, course: null, loading: false, error: '' };
export function createFormationStore({ storage } = {}) {
  let state = loadState(storage);
  const listeners = new Set();
  function getState() { return state; }
  function setState(patch) { state = { ...state, ...patch }; saveState(storage, state); listeners.forEach((listener) => listener(state)); }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  return { getState, setState, subscribe };
}
function loadState(storage) { try { return { ...DEFAULT_STATE, ...JSON.parse(storage?.getItem?.(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return { ...DEFAULT_STATE }; } }
function saveState(storage, state) { try { const serialized = JSON.stringify({ selectedLessonId: state.selectedLessonId, progress: state.progress }); storage?.setItem ? storage.setItem(STORAGE_KEY, serialized) : localStorage.setItem(STORAGE_KEY, serialized); } catch {} }
