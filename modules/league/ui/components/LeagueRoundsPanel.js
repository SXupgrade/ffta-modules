/**
 * @param {{ app: Object, rounds: Array, settings: Object }} props
 * @returns {string} HTML string
 */
export function LeagueRoundsPanel({ app, rounds = [], settings = {} } = {}) {
  if (rounds.length === 0) {
    return `<p class="ffta-muted ffta-small">${app.t('league.rounds.noRounds')}</p>`;
  }

  const items = rounds.map((round, i) => {
    const label = app.t('league.rounds.round', { index: round.index ?? (i + 1) });
    const missingClass = round.found === false ? ' league-round--missing' : '';
    return `
      <div class="league-round${missingClass}">
        <span class="league-round__label">${escapeHtml(label)}</span>
        <span class="league-round__code ffta-muted ffta-small">${escapeHtml(round.code ?? round.name ?? '')}</span>
        ${round.found === false
          ? `<span class="ffta-badge ffta-badge--warning">${escapeHtml(app.t('league.warnings.missingRoundData', { round: round.code }))}</span>`
          : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="league-rounds">
      <div class="league-rounds__label ffta-muted ffta-small">${app.t('league.rounds.title')}</div>
      <div class="league-rounds__list">${items}</div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
