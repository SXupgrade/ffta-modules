/**
 * Lightweight DOM-based modal. Returns controller with close().
 * @param {{ id?: string, title?: string, body?: string, footer?: string }} config
 * @returns {{ close: Function, el: HTMLElement }}
 */
export function CpModal({ id = 'cp-modal', title = '', body = '', footer = '' } = {}) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = id;
  el.className = 'cp-modal-backdrop';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="cp-modal">
      <div class="cp-modal__header">
        <span class="cp-modal__title">${title}</span>
        <button class="cp-modal__close" data-close-modal type="button" aria-label="Close">&times;</button>
      </div>
      <div class="cp-modal__body">${body}</div>
      ${footer ? `<div class="cp-modal__footer">${footer}</div>` : ''}
    </div>
  `;

  function close() {
    el.remove();
  }

  el.addEventListener('click', (event) => {
    if (event.target === el || event.target.closest('[data-close-modal]')) {
      close();
    }
  });

  document.addEventListener('keydown', function handler(event) {
    if (event.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handler);
    }
  });

  document.body.appendChild(el);
  return { close, el };
}
