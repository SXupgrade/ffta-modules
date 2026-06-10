import { addHistoryItem, createTossCommitment, exportProof, normalizeOptions, revealToss, verifyTossProof } from '../domain/toss.provablyFair.js';

export function createTossViewModel({ app, store }) {
  const state = store.getState();
  state.__store = store;

  function sync() {
    Object.assign(state, store.getState(), { __store: store });
  }

  store.subscribe(sync);

  function updateForm(patch) {
    store.setState({ ...patch, error: null });
  }

  async function prepare() {
    const current = store.getState();
    try {
      store.setState({ isBusy: true, error: null, proofText: '' });
      const commitment = await createTossCommitment({
        mode: current.mode,
        label: current.label,
        options: current.mode === 'coin' ? [] : current.optionsText
      });
      store.setState({ current: commitment, isBusy: false, proofText: JSON.stringify(exportProof(commitment), null, 2) });
    } catch (error) {
      store.setState({ isBusy: false, error: localizeError(app, error) });
    }
  }

  async function reveal() {
    const current = store.getState().current;
    if (!current) return;
    try {
      store.setState({ isBusy: true, error: null });
      const revealed = await revealToss({ commitment: current });
      const history = addHistoryItem(store.getState().history, exportProof(revealed));
      store.setState({ current: revealed, history, isBusy: false, proofText: JSON.stringify(exportProof(revealed), null, 2) });
    } catch (error) {
      store.setState({ isBusy: false, error: localizeError(app, error) });
    }
  }

  async function verifyProofText(text) {
    try {
      const proof = JSON.parse(text || store.getState().proofText || '{}');
      const result = await verifyTossProof(proof);
      store.setState({ error: result.ok ? null : result.reason, proofText: JSON.stringify(proof, null, 2) });
      if (result.ok) app.notify?.success?.(app.t('toss.messages.proofValid'));
      else app.notify?.error?.(result.reason);
      return result;
    } catch (error) {
      store.setState({ error: localizeError(app, error) });
      return { ok: false, reason: error.message || String(error) };
    }
  }

  function reset() {
    store.setState({ current: null, error: null, proofText: '' });
  }

  function clearHistory() {
    store.setState({ history: [], error: null });
  }

  function getOptionsPreview() {
    const current = store.getState();
    return normalizeOptions(current.mode === 'coin' ? [] : current.optionsText, current.mode);
  }

  function exportCurrentJson() {
    const proof = exportProof(store.getState().current);
    if (!proof) return;
    const filename = `${proof.id || 'toss-proof'}.json`;
    downloadText(filename, JSON.stringify(proof, null, 2), 'application/json');
  }

  function exportHistoryJson() {
    downloadText('toss-history.json', JSON.stringify(store.getState().history || [], null, 2), 'application/json');
  }

  async function copyProof() {
    const text = store.getState().proofText || JSON.stringify(exportProof(store.getState().current), null, 2);
    if (!text) return;
    await globalThis.navigator?.clipboard?.writeText(text);
    app.notify?.success?.(app.t('toss.messages.proofCopied'));
  }

  return {
    state,
    updateForm,
    prepare,
    reveal,
    reset,
    clearHistory,
    getOptionsPreview,
    exportCurrentJson,
    exportHistoryJson,
    copyProof,
    verifyProofText
  };
}

function localizeError(app, error) {
  const message = error?.message || String(error);
  if (message.includes('At least two options')) return app.t('toss.errors.optionsRequired');
  if (message.includes('Secure random')) return app.t('toss.errors.cryptoUnavailable');
  if (message.includes('SHA-256')) return app.t('toss.errors.cryptoUnavailable');
  return message;
}

function downloadText(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
