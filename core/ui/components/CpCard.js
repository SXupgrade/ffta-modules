/**
 * @param {{ title?: string, body?: string, actions?: string, className?: string }} props
 * @returns {string} HTML string
 */
export function CpCard({ title = '', body = '', actions = '', className = '' } = {}) {
  const titleHtml = title ? `<div class="cp-card__title">${title}</div>` : '';
  const actionsHtml = actions ? `<div class="cp-card__actions">${actions}</div>` : '';
  return `
    <div class="cp-card${className ? ' ' + className : ''}">
      ${titleHtml}
      <div class="cp-card__body">${body}</div>
      ${actionsHtml}
    </div>
  `;
}
