import { RecordsTable } from './RecordsTable.js';

export function RecordsStandingsPanel({ app, state }) {
  const areaRows = state.areas?.length
    ? state.areas.map((area) => `
      <tr>
        <td>${escapeHtml(area.code)}</td>
        <td>${escapeHtml(area.name ?? area.code)}</td>
        <td class="records-num">${escapeHtml(area.globalRecordsCount ?? 0)}</td>
        <td class="records-num">${escapeHtml(area.tournamentRecordsCount ?? 0)}</td>
        <td><button type="button" class="cp-btn ffta-button--danger" data-action="deleteRecordArea" data-area-code="${escapeHtml(area.code)}">${escapeHtml(app.t('records.actions.delete'))}</button></td>
      </tr>
    `).join('')
    : `<tr><td colspan="5" class="records-empty">${escapeHtml(app.t('records.standings.noAreas'))}</td></tr>`;

  return `
    <div class="records-view records-view--standings">
      <section class="records-card records-area-manager">
        <div class="records-section-header">
          <div>
            <h2>${escapeHtml(app.t('records.standings.areasTitle'))}</h2>
            <p class="ffta-muted">${escapeHtml(app.t('records.standings.areasHelp'))}</p>
          </div>
        </div>
        <form class="records-area-form" data-records-area-form>
          <label class="records-field">
            <span>${escapeHtml(app.t('records.config.areaCode'))}</span>
            <input name="areaCode" maxlength="20" placeholder="RECORD" />
          </label>
          <label class="records-field">
            <span>${escapeHtml(app.t('records.config.areaName'))}</span>
            <input name="areaName" maxlength="50" placeholder="Regional records" />
          </label>
          <button type="button" class="cp-btn cp-btn--primary" data-action="saveRecordArea" ${state.isSaving ? 'disabled' : ''}>${escapeHtml(app.t('records.standings.saveArea'))}</button>
        </form>
        <div class="records-table-wrap">
          <table class="cp-table records-table">
            <thead><tr>
              <th>${escapeHtml(app.t('records.columns.area'))}</th>
              <th>${escapeHtml(app.t('records.columns.name'))}</th>
              <th>${escapeHtml(app.t('records.standings.globalCount'))}</th>
              <th>${escapeHtml(app.t('records.standings.tournamentCount'))}</th>
              <th>${escapeHtml(app.t('records.columns.actions'))}</th>
            </tr></thead>
            <tbody>${areaRows}</tbody>
          </table>
        </div>
      </section>

      <section class="records-card records-standings-actions">
        <div class="records-section-header">
          <div>
            <h2>${escapeHtml(app.t('records.standings.importExportTitle'))}</h2>
            <p class="ffta-muted">${escapeHtml(app.t('records.standings.importExportHelp'))}</p>
          </div>
          <div class="records-button-row">
            <button type="button" class="cp-btn cp-btn--primary" data-action="openImport" ${state.isSaving ? 'disabled' : ''}>${escapeHtml(app.t('records.actions.import'))}</button>
            <button type="button" class="cp-btn" data-action="exportCsv">${escapeHtml(app.t('records.actions.exportCsv'))}</button>
            <button type="button" class="cp-btn" data-action="exportJson">${escapeHtml(app.t('records.actions.exportJson'))}</button>
          </div>
        </div>
      </section>

      ${RecordsTable({ app, records: state.globalRecords, title: app.t('records.records.globalTitle'), emptyLabel: app.t('records.records.globalEmpty'), scope: 'global' })}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
