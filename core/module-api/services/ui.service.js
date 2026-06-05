import { CpButton } from '../../ui/components/CpButton.js';
import { CpCard } from '../../ui/components/CpCard.js';
import { CpEmptyState } from '../../ui/components/CpEmptyState.js';
import { CpTable } from '../../ui/components/CpTable.js';
import { CpModal } from '../../ui/components/CpModal.js';

export function createUiService() {
  return {
    renderButton: CpButton,
    renderCard: CpCard,
    renderTable: CpTable,
    renderEmptyState: CpEmptyState,
    renderToolbar(actions = []) {
      return `<div class="ffta-toolbar">${actions.map((action) => CpButton(action)).join('')}</div>`;
    },
    openModal(config = {}) {
      return CpModal(config);
    },
    confirm({ title = 'Confirm', message = 'Are you sure?', confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = {}) {
      return new Promise((resolve) => {
        const modal = CpModal({
          id: `cp-confirm-${Date.now()}`,
          title: escapeHtml(title),
          body: `<p>${escapeHtml(message)}</p>`,
          footer: `
            <button type="button" class="cp-btn cp-btn--ghost" data-confirm="cancel">${escapeHtml(cancelLabel)}</button>
            <button type="button" class="cp-btn cp-btn--primary" data-confirm="ok">${escapeHtml(confirmLabel)}</button>
          `
        });
        modal.el.addEventListener('click', (event) => {
          const action = event.target.closest('[data-confirm]')?.dataset.confirm;
          if (!action) return;
          modal.close();
          resolve(action === 'ok');
        });
      });
    },
    setReadonlyMode(root, isReadonly = true) {
      if (!root) return;
      root.classList.toggle('ffta-readonly', Boolean(isReadonly));
      root.querySelectorAll('[data-requires-write]').forEach((element) => {
        element.toggleAttribute('disabled', Boolean(isReadonly));
        element.setAttribute('aria-disabled', String(Boolean(isReadonly)));
      });
    }
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
