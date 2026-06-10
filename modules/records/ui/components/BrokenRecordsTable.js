export function BrokenRecordsTable({ app, records }) {
  const rows = records?.length
    ? records.map((record) => `
      <tr>
        <td>${escapeHtml(record.areaCode)}</td>
        <td>${escapeHtml(record.category)}</td>
        <td>${escapeHtml([record.firstName, record.lastName].filter(Boolean).join(' ') || record.athleteId || record.teamId)}</td>
        <td>${escapeHtml(record.eventCode)}</td>
        <td>${escapeHtml(record.previousTotal)}</td>
        <td>${escapeHtml(record.brokenAt)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="6" class="records-empty">${escapeHtml(app.t('records.broken.empty'))}</td></tr>`;

  return `
    <section class="records-card records-table-card">
      <h2>${escapeHtml(app.t('records.broken.title'))}</h2>
      <div class="records-table-wrap">
        <table class="cp-table records-table">
          <thead><tr>
            <th>${escapeHtml(app.t('records.columns.area'))}</th>
            <th>${escapeHtml(app.t('records.columns.category'))}</th>
            <th>${escapeHtml(app.t('records.columns.athlete'))}</th>
            <th>${escapeHtml(app.t('records.columns.event'))}</th>
            <th>${escapeHtml(app.t('records.columns.previous'))}</th>
            <th>${escapeHtml(app.t('records.columns.date'))}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
