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

  // Build column headers: fixed columns + one per round
  let headers = `
    <th class="cp-table__th cp-table__th--center">${app.t('league.standings.rank')}</th>
    <th class="cp-table__th">${app.t('league.standings.team')}</th>
  `;
  for (let i = 0; i < rounds.length; i++) {
    const label = app.t('league.standings.round', { index: i + 1 });
    headers += `<th class="cp-table__th cp-table__th--right" colspan="3">${escapeHtml(label)}</th>`;
  }
  headers += `<th class="cp-table__th cp-table__th--right">${app.t('league.standings.total')}</th>`;

  // Sub-headers for round columns
  let subHeaders = '<th></th><th></th>';
  for (let i = 0; i < rounds.length; i++) {
    subHeaders += `
      <th class="cp-table__th cp-table__th--right ffta-muted ffta-small">${app.t('league.standings.qualPts')}</th>
      <th class="cp-table__th cp-table__th--right ffta-muted ffta-small">${app.t('league.standings.matchPts')}</th>
      <th class="cp-table__th cp-table__th--right ffta-muted ffta-small">${app.t('league.standings.bracketPts')}</th>
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
      const rd = roundsMap[round.code] ?? { qualificationPoints: 0, matchPoints: 0, bracketPoints: 0 };
      cells += `
        <td class="cp-table__td cp-table__td--right">${rd.qualificationPoints ?? 0}</td>
        <td class="cp-table__td cp-table__td--right">${rd.matchPoints ?? 0}</td>
        <td class="cp-table__td cp-table__td--right">${rd.bracketPoints ?? 0}</td>
      `;
    }
    cells += `<td class="cp-table__td cp-table__td--right ffta-bold">${row.totalPoints ?? 0}</td>`;
    return `<tr>${cells}</tr>`;
  }).join('');

  const showSubHeaders = rounds.length > 0;

  return `
    <div class="league-group">
      <h2 class="league-group__title">${escapeHtml(title)}</h2>
      <div class="cp-table-wrap">
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
