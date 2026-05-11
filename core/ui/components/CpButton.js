/**
 * @param {{ label?: string, action?: string, variant?: 'primary'|'secondary'|'ghost', disabled?: boolean, type?: string }} props
 * @returns {string} HTML string
 */
export function CpButton({ label = '', action = '', variant = 'secondary', disabled = false, type = 'button' } = {}) {
  const disabledAttr = disabled ? ' disabled' : '';
  const actionAttr = action ? ` data-action="${action}"` : '';
  return `<button class="cp-btn cp-btn--${variant}"${actionAttr} type="${type}"${disabledAttr}>${label}</button>`;
}
