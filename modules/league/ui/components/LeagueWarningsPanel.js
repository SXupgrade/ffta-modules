/**
 * @param {{ app: Object, warnings: Array }} props
 * @returns {string} HTML string
 */
export function LeagueWarningsPanel({ app, warnings = [] } = {}) {
  if (warnings.length === 0) {
    return '';
  }

  const items = warnings.map((w) => {
    const text = app.t(w.messageKey, w.params ?? {});
    const level = w.level === 'error' ? 'error'
                : w.level === 'info'  ? 'info'
                : 'warning';
    return `
      <div class="league-warning league-warning--${level}">
        <span class="ffta-badge ffta-badge--${level}">${level}</span>
        <span>${escapeHtml(text)}</span>
      </div>
    `;
  }).join('');

  return `<div class="league-warnings">${items}</div>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
