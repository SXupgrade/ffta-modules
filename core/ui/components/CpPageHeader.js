/**
 * En-tête de page standard (harmonisation v0.2.13).
 *
 * Remplace les deux patterns concurrents (« hero + kicker » des modules
 * récents, composants LeagueHeader/RecordsHeader des modules historiques)
 * par une structure unique. Le kicker dérive de l'accent du module
 * (--ffta-module-accent, posé sur l'outlet par le shell).
 *
 * @param {{ kicker?: string, title?: string, description?: string, badge?: string, actions?: string, className?: string }} props
 * @returns {string} HTML string
 */
export function CpPageHeader({ kicker = '', title = '', description = '', badge = '', actions = '', className = '' } = {}) {
  const kickerHtml = kicker ? `<p class="ffta-kicker">${kicker}</p>` : '';
  const descriptionHtml = description ? `<p class="ffta-muted">${description}</p>` : '';
  const badgeHtml = badge ? `<span class="ffta-badge ffta-badge--neutral">${badge}</span>` : '';
  const actionsHtml = actions ? `<div class="ffta-actions">${actions}</div>` : '';
  const sideHtml = badgeHtml || actionsHtml ? `<div class="ffta-actions">${badgeHtml}${actionsHtml}</div>` : '';
  return `
    <div class="ffta-page__header${className ? ' ' + className : ''}">
      <div>
        ${kickerHtml}
        <h1>${title}</h1>
        ${descriptionHtml}
      </div>
      ${sideHtml}
    </div>
  `;
}
