/**
 * Renders one standings table per category group.
 *
 * @param {{ app: Object, groups: Array, rounds: Array }} props
 * @returns {string} HTML string
 */
export function LeagueStandingsTable({ app, groups = [], rounds = [] } = {}) {
  if (groups.length === 0) {
    return `<p class="ffta-muted">${app.t('league.standings.noTeams')}</p>`;
  }

  return groups.map((group) => renderGroup(app, group, rounds)).join('');
}

function renderGroup(app, group, rounds) {
  const title = group.groupKey || `${group.division || ''} ${group.className || ''}`.trim();

  let headers = `
    <th class="cp-table__th cp-table__th--center">${app.t('league.standings.rank')}</th>
    <th class="cp-table__th">${app.t('league.standings.team')}</th>
  `;
  for (let i = 0; i < rounds.length; i++) {
    const label = app.t('league.standings.round', { index: i + 1 });
    headers += `<th class="cp-table__th cp-table__th--center" colspan="7">${escapeHtml(label)}</th>`;
  }
  headers += `<th class="cp-table__th cp-table__th--right">${app.t('league.standings.total')}</th>`;

  let subHeaders = '<th></th><th></th>';
  for (let i = 0; i < rounds.length; i++) {
    subHeaders += `
      <th class="cp-table__th cp-table__th--right ffta-muted ffta-small">${app.t('league.standings.qualRank')}</th>
      <th class="cp-table__th cp-table__th--right ffta-muted ffta-small">${app.t('league.standings.qualPts')}</th>
      <th class="cp-table__th cp-table__th--right ffta-muted ffta-small">${app.t('league.standings.matchWins')}</th>
      <th class="cp-table__th cp-table__th--right ffta-muted ffta-small">${app.t('league.standings.matchPts')}</th>
      <th class="cp-table__th cp-table__th--right ffta-muted ffta-small">${app.t('league.standings.finalRank')}</th>
      <th class="cp-table__th cp-table__th--right ffta-muted ffta-small">${app.t('league.standings.finalPts')}</th>
      <th class="cp-table__th cp-table__th--right ffta-muted ffta-small">${app.t('league.standings.roundTotal')}</th>
    `;
  }
  subHeaders += '<th></th>';

  const rows = (group.rows ?? []).map((row) => {
    let cells = `
      <td class="cp-table__td cp-table__td--center">${row.rank}</td>
      <td class="cp-table__td">${escapeHtml(row.teamName ?? row.teamCode ?? '')}</td>
    `;
    const roundsMap = {};
    for (const rd of (row.rounds ?? [])) {
      roundsMap[rd.roundCode] = rd;
    }
    for (const round of rounds) {
      const rd = roundsMap[round.code] ?? defaultRoundDetail();
      cells += `
        <td class="cp-table__td cp-table__td--right">${formatRank(rd.qualificationRank)}</td>
        <td class="cp-table__td cp-table__td--right">${formatNumber(rd.qualificationPoints)}</td>
        <td class="cp-table__td cp-table__td--right">${formatNumber(rd.matchWins)}</td>
        <td class="cp-table__td cp-table__td--right">${formatNumber(rd.matchPoints)}</td>
        <td class="cp-table__td cp-table__td--right">${formatRank(rd.finalRank)}</td>
        <td class="cp-table__td cp-table__td--right">${formatNumber(rd.bracketPoints)}</td>
        <td class="cp-table__td cp-table__td--right ffta-bold">${formatNumber(rd.totalRoundPoints)}</td>
      `;
    }
    cells += `<td class="cp-table__td cp-table__td--right ffta-bold">${formatNumber(row.totalPoints)}</td>`;
    return `<tr>${cells}</tr>`;
  }).join('');

  const showSubHeaders = rounds.length > 0;

  return `
    <div class="league-group" data-category-key="${escapeAttr(group.groupKey ?? '')}">
      <div class="league-group__header">
        <h2 class="league-group__title">${escapeHtml(title)}</h2>
        <button type="button" class="cp-btn cp-btn--ghost" data-action="openCategorySettings" data-category-key="${escapeAttr(group.groupKey ?? '')}" title="${escapeAttr(app.t('league.categorySettings.open'))}">${escapeHtml(app.t('league.categorySettings.openShort'))}</button>
      </div>
      <div class="cp-table-wrap league-standings-wrap">
        <table class="cp-table league-standings-table">
          <thead>
            <tr>${headers}</tr>
            ${showSubHeaders ? `<tr class="cp-table__subheader">${subHeaders}</tr>` : ''}
          </thead>
          <tbody>
            ${rows || `<tr><td class="cp-table__empty" colspan="100">${app.t('league.standings.noTeams')}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function defaultRoundDetail() {
  return {
    qualificationRank: null,
    qualificationPoints: 0,
    matchWins: 0,
    matchPoints: 0,
    finalRank: null,
    bracketPoints: 0,
    totalRoundPoints: 0
  };
}

function formatNumber(value) {
  return Number(value ?? 0);
}

function formatRank(value) {
  const number = Number(value ?? 0);
  return number > 0 ? number : '—';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return String(value ?? '').replace(/"/g, '&quot;');
}
