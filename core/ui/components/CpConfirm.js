import { CpModal } from './CpModal.js';

/**
 * UX v0.2.14 — confirmation explicite pour les actions destructives.
 * Remplace window.confirm() : une modale qui dit clairement ce qui va
 * disparaître, avec un bouton rouge. Retourne une Promise<boolean>.
 *
 * @param {{ app: Object, title?: string, message?: string, confirmLabel?: string, cancelLabel?: string }} config
 * @returns {Promise<boolean>}
 */
export function CpConfirm({ app, title = '', message = '', confirmLabel = '', cancelLabel = '' } = {}) {
  const confirmText = confirmLabel || app?.t?.('app.confirm.confirm') || 'Confirmer';
  const cancelText = cancelLabel || app?.t?.('app.actions.cancel') || 'Annuler';

  return new Promise((resolve) => {
    const modal = CpModal({
      id: 'cp-confirm-modal',
      title,
      body: `<p>${escapeHtml(message)}</p>`,
      footer: `
        <button type="button" class="cp-btn cp-btn--secondary" data-confirm="no">${escapeHtml(cancelText)}</button>
        <button type="button" class="cp-btn ffta-button--danger" data-confirm="yes">${escapeHtml(confirmText)}</button>
      `
    });

    function settle(value) {
      modal.close();
      resolve(value);
    }

    modal.el.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-confirm]')?.dataset.confirm;
      if (choice === 'yes') settle(true);
      if (choice === 'no') settle(false);
      if (event.target.closest('[data-close-modal]')) settle(false);
    });
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
