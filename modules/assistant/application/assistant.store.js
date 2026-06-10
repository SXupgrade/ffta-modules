import { ASSISTANT_ITEMS } from '../domain/assistant.catalog.js';
import { buildSummary, evaluateChecklist } from '../domain/assistant.engine.js';

const STATUS_STORAGE_KEY = 'ffta.assistant.statuses.v1';
const EVENTS_STORAGE_KEY = 'ffta.assistant.events.v1';

export function createAssistantStore({ storage } = {}) {
  let state = createState({ statuses: readJson(storage, STATUS_STORAGE_KEY, {}), events: readJson(storage, EVENTS_STORAGE_KEY, []) });
  const listeners = new Set();

  function getState() { return state; }

  function setState(patch) {
    state = { ...state, ...patch };
    state.items = evaluateChecklist({ items: ASSISTANT_ITEMS, statuses: state.statuses, metrics: state.metrics, events: state.events });
    state.summary = buildSummary(state.items);
    if (Object.prototype.hasOwnProperty.call(patch, 'statuses')) writeJson(storage, STATUS_STORAGE_KEY, state.statuses);
    if (Object.prototype.hasOwnProperty.call(patch, 'events')) writeJson(storage, EVENTS_STORAGE_KEY, state.events);
    for (const listener of listeners) listener(state);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}

function createState({ statuses = {}, events = [] } = {}) {
  const metrics = {};
  const items = evaluateChecklist({ items: ASSISTANT_ITEMS, statuses, metrics, events });
  return {
    isLoading: false,
    error: null,
    selectedPhase: 'all',
    statuses,
    events,
    metrics,
    items,
    summary: buildSummary(items)
  };
}

function readJson(storage, key, fallback) {
  try {
    const raw = storage?.getItem ? storage.getItem(key) : globalThis.localStorage?.getItem(key);
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  try {
    const raw = JSON.stringify(value);
    if (storage?.setItem) storage.setItem(key, raw);
    else globalThis.localStorage?.setItem(key, raw);
  } catch {}
}
