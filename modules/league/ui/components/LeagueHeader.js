/**
 * @param {{ title: string, masterName?: string }} props
 * @returns {string} HTML string
 */
export function LeagueHeader({ title = '', masterName = '' } = {}) {
  const sub = masterName
    ? `<span class="league-header__master">${escapeHtml(masterName)}</span>`
    : '';
  return `
    <div class="league-header">
      <div class="league-header__info">
        <h1 class="league-header__title">${escapeHtml(title)}</h1>
        ${sub}
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
