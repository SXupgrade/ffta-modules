/**
 * Minimal ViewModel example.
 * The ViewModel orchestrates app services and exposes actions to the UI.
 */
export function createMinimalViewModel({ app, store }) {
  async function load() {
    store.patch({ isLoading: true, error: null });

    try {
      const greeting = await app.settings.get('minimal-module.greeting', 'Hello from Minimal Module');
      const tournament = await app.context.getTournament();
      store.patch({ greeting, tournament, isLoading: false });
    } catch (error) {
      store.patch({ error: String(error?.message ?? error), isLoading: false });
    }
  }

  async function saveGreeting(value) {
    const nextGreeting = String(value ?? '').trim() || 'Hello from Minimal Module';
    await app.settings.set('minimal-module.greeting', nextGreeting);
    store.patch({ greeting: nextGreeting });
    app.notify.success(app.t('minimal.messages.saved'));
  }

  function incrementCounter() {
    store.patch({ clickCount: store.state.clickCount + 1 });
  }

  return {
    state: Object.assign(store.state, { __store: store }),
    load,
    saveGreeting,
    incrementCounter
  };
}
