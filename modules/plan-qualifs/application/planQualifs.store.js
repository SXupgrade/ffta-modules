import { createInitialPlanQualifsState } from './state/initialState.js';

export function createPlanQualifsStore() {
  const listeners = new Set();
  const state = createInitialPlanQualifsState();

  function emit() {
    for (const listener of listeners) listener(state);
  }

  return {
    state,
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    patch(values) {
      Object.assign(state, values);
      emit();
    },
    reset() {
      Object.assign(state, createInitialPlanQualifsState());
      emit();
    }
  };
}
