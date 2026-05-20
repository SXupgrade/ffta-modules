/**
 * Lightweight DOM-based modal. Returns controller with close().
 *
 * Ianseo renders module pages inside its own shell. The modal must therefore be
 * mounted inside the FFTA shell so scoped styles such as
 * `.ffta-modules-shell .cp-modal-backdrop` still apply. If the shell is not
 * available yet, we fall back to document.body.
 *
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

  const handleKeydown = (event) => {
    if (event.key === 'Escape') close();
  };

  function close() {
    document.removeEventListener('keydown', handleKeydown);
    el.remove();
  }

  el.addEventListener('click', (event) => {
    if (event.target === el || event.target.closest('[data-close-modal]')) {
      close();
    }
  });

  document.addEventListener('keydown', handleKeydown);

  const portal = document.querySelector('.ffta-modules-shell') || document.body;
  portal.appendChild(el);

  return { close, el };
}
