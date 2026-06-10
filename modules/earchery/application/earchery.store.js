import { createInitialGameState } from '../domain/earchery.game.js';

const STORAGE_KEY = 'ffta.earchery.bestScore.v1';

export function createEArcheryStore({ storage } = {}) {
  let state = {
    ...createInitialGameState(),
    bestScore: readBestScore(storage),
    error: null
  };
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(patch, options = {}) {
    state = { ...state, ...patch };
    if (Object.prototype.hasOwnProperty.call(patch, 'bestScore')) {
      writeBestScore(storage, state.bestScore);
    }
    if (!options.silent) {
      for (const listener of listeners) listener(state);
    }
  }

  function replaceState(nextState) {
    state = { ...nextState };
    writeBestScore(storage, state.bestScore);
    for (const listener of listeners) listener(state);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, replaceState, subscribe };
}

function readBestScore(storage) {
  try {
    const raw = storage?.getItem ? storage.getItem(STORAGE_KEY) : globalThis.localStorage?.getItem(STORAGE_KEY);
    const value = Number(raw || 0);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeBestScore(storage, value) {
  try {
    const raw = String(Number(value) || 0);
    if (storage?.setItem) storage.setItem(STORAGE_KEY, raw);
    else globalThis.localStorage?.setItem(STORAGE_KEY, raw);
  } catch {}
}
