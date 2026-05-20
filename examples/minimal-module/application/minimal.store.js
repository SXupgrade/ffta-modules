/**
 * Tiny observable store example.
 * Real modules can keep this pattern or replace it with a richer store,
 * as long as UI components do not mutate state directly.
 */
export function createMinimalStore() {
  const subscribers = new Set();
  const state = {
    isLoading: false,
    greeting: '',
    clickCount: 0,
    tournament: null,
    error: null
  };

  function notify() {
    for (const subscriber of subscribers) subscriber(state);
  }

  return {
    state,
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    patch(nextState) {
      Object.assign(state, nextState);
      notify();
    }
  };
}
