/**
 * @param {{ icon?: string, title?: string, detail?: string, actions?: string }} props
 * @returns {string} HTML string
 */
export function CpEmptyState({ icon = '⬜', title = '', detail = '', actions = '' } = {}) {
  return `
    <div class="cp-empty-state">
      <div class="cp-empty-state__icon" aria-hidden="true">${icon}</div>
      ${title ? `<div class="cp-empty-state__title">${title}</div>` : ''}
      ${detail ? `<div class="cp-empty-state__detail">${detail}</div>` : ''}
      ${actions ? `<div class="cp-empty-state__actions">${actions}</div>` : ''}
    </div>
  `;
}
