export function createRuleBuilderViewModel({ app, store }) {
  const moduleBaseUrl = new URL('../', import.meta.url).href;
  const apiUrl = new URL('./api/rule-builder.php', moduleBaseUrl).href;

  async function load() {
    store.set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${apiUrl}?action=status`);
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error || 'Rule Builder API error.');
      store.set({ isLoading: false, status: payload.data });
    } catch (error) {
      store.set({ isLoading: false, error: error.message || String(error) });
    }
  }

  function download() {
    // No lab-runtime mock here (unlike export-ffta's): a rule-builder
    // export only makes sense against a real tournament's real configured
    // divisions/classes/events -- there is no meaningful client-side
    // approximation of that to fall back to.
    store.set({ isDownloading: true });
    window.location.href = `${apiUrl}?action=download`;
    // The browser handles the actual file download; there is no response
    // to await here, so just clear the transient "downloading" state.
    setTimeout(() => store.set({ isDownloading: false }), 1000);
  }

  return { state: store.state, load, download };
}
