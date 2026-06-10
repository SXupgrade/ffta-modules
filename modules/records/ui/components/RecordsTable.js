export function RecordsTable({ app, records, title, emptyLabel, scope = 'global', canEdit = true }) {
  const rows = records?.length
    ? records.map((record, index) => `
      <tr>
        <td>${escapeHtml(record.recordCode ?? record.areaCode)}</td>
        <td>${escapeHtml(record.recordLabel ?? record.distance)}</td>
        <td>${escapeHtml(record.category)}</td>
        <td>${escapeHtml(record.categoryName)}</td>
        <td class="records-num">${escapeHtml(record.total)}</td>
        <td class="records-num">${escapeHtml(record.maxScore)}</td>
        <td class="records-num">${escapeHtml(record.tieBreaker ?? record.xNine)}</td>
        <td>${escapeHtml(record.holderName)}</td>
        <td>${escapeHtml(record.holderClubOrCountry)}</td>
        <td>${escapeHtml(record.place)}</td>
        <td>${escapeHtml(record.date ?? record.recordDate)}</td>
        <td class="records-num">${formatFlag(record.isTeam ?? record.team)}</td>
        <td class="records-num">${formatFlag(record.isMixed ?? record.isDouble)}</td>
        <td class="records-num">${formatFlag(record.isPara ?? record.para)}</td>
        ${canEdit ? `<td><button type="button" class="ffta-button ffta-button--small" data-action="editRecord" data-record-scope="${escapeHtml(scope)}" data-record-index="${index}">${escapeHtml(app.t('records.actions.edit'))}</button></td>` : ''}
      </tr>
    `).join('')
    : `<tr><td colspan="${canEdit ? 15 : 14}" class="records-empty">${escapeHtml(emptyLabel ?? app.t('records.records.empty'))}</td></tr>`;

  return `
    <section class="records-card records-table-card">
      <h2>${escapeHtml(title ?? app.t('records.records.title'))}</h2>
      <div class="records-table-wrap">
        <table class="cp-table records-table records-table--canonical">
          <thead><tr>
            <th>${escapeHtml(app.t('records.canonical.recordCode'))}</th>
            <th>${escapeHtml(app.t('records.canonical.recordLabel'))}</th>
            <th>${escapeHtml(app.t('records.canonical.category'))}</th>
            <th>${escapeHtml(app.t('records.canonical.categoryName'))}</th>
            <th>${escapeHtml(app.t('records.canonical.total'))}</th>
            <th>${escapeHtml(app.t('records.canonical.maxScore'))}</th>
            <th>${escapeHtml(app.t('records.canonical.tieBreaker'))}</th>
            <th>${escapeHtml(app.t('records.canonical.holderName'))}</th>
            <th>${escapeHtml(app.t('records.canonical.holderClubOrCountry'))}</th>
            <th>${escapeHtml(app.t('records.canonical.place'))}</th>
            <th>${escapeHtml(app.t('records.canonical.date'))}</th>
            <th>${escapeHtml(app.t('records.canonical.isTeam'))}</th>
            <th>${escapeHtml(app.t('records.canonical.isMixed'))}</th>
            <th>${escapeHtml(app.t('records.canonical.isPara'))}</th>
            ${canEdit ? `<th>${escapeHtml(app.t('records.columns.actions'))}</th>` : ''}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function formatFlag(value) {
  return Number(value ?? 0) ? '1' : '0';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
