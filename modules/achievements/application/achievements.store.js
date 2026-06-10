import { ACHIEVEMENT_CATALOG } from '../domain/achievements.catalog.js';
import { buildSummary, evaluateAchievements } from '../domain/achievements.engine.js';

const STORAGE_KEY = 'ffta.achievements.events.v1';

export function createAchievementsStore({ storage } = {}) {
  let state = createState({ events: readEvents(storage) });
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(patch) {
    state = { ...state, ...patch };
    state.achievements = evaluateAchievements({ metrics: state.metrics, events: state.events, catalog: ACHIEVEMENT_CATALOG });
    state.summary = buildSummary(state.achievements);
    if (Object.prototype.hasOwnProperty.call(patch, 'events')) writeEvents(storage, state.events);
    for (const listener of listeners) listener(state);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}

function createState({ events = [] } = {}) {
  const metrics = {};
  const achievements = evaluateAchievements({ metrics, events, catalog: ACHIEVEMENT_CATALOG });
  return {
    isLoading: false,
    error: null,
    mode: 'scan',
    metrics,
    events,
    achievements,
    summary: buildSummary(achievements),
    selectedCategory: 'all'
  };
}

function readEvents(storage) {
  try {
    const raw = storage?.getItem ? storage.getItem(STORAGE_KEY) : globalThis.localStorage?.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(storage, events) {
  try {
    const raw = JSON.stringify(Array.isArray(events) ? events : []);
    if (storage?.setItem) storage.setItem(STORAGE_KEY, raw);
    else globalThis.localStorage?.setItem(STORAGE_KEY, raw);
  } catch {}
}
