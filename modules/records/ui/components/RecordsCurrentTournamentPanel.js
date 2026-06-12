import { BrokenRecordsTable } from './BrokenRecordsTable.js';
import { RecordsTable } from './RecordsTable.js';

export function RecordsCurrentTournamentPanel({ app, state }) {
  const availableAreas = state.areas ?? [];
  const selectedCodes = new Set([
    ...(state.records ?? []).map((record) => record.areaCode).filter(Boolean),
    ...(state.monitoredRecords ?? []).map((record) => record.areaCode).filter(Boolean)
  ]);
  const catalogCounts = new Map((state.recordCodes ?? []).map((item) => [item.areaCode, item.recordsCount ?? 0]));

  const areaRows = availableAreas.length
    ? availableAreas.map((area) => {
      const checked = selectedCodes.has(area.code) ? 'checked' : '';
      const count = catalogCounts.get(area.code) ?? 0;
      return `
        <label class="records-area-option">
          <input type="checkbox" name="areaCode" value="${escapeHtml(area.code)}" ${checked} />
          <span class="records-area-option__main">
            <strong>${escapeHtml(area.code)}</strong>
            <small>${escapeHtml(area.name ?? area.code)}</small>
          </span>
          <span class="records-area-option__count">${escapeHtml(count)} ${escapeHtml(app.t('records.labels.recordsShort'))}</span>
        </label>
      `;
    }).join('')
    : `<div class="records-empty">${escapeHtml(app.t('records.current.noAreas'))}</div>`;

  return `
    <div class="records-view records-view--current">
      <section class="records-card records-current-areas">
        <div class="records-section-header">
          <div>
            <h2>${escapeHtml(app.t('records.current.areasTitle'))}</h2>
            <p class="ffta-muted">${escapeHtml(app.t('records.current.areasHelp'))}</p>
          </div>
          <button type="button" class="cp-btn cp-btn--primary" data-action="syncTournamentRecordAreas" ${state.isSaving ? 'disabled' : ''}>${escapeHtml(app.t('records.current.applySelection'))}</button>
        </div>
        <form class="records-area-selector" data-records-area-selector>
          ${areaRows}
        </form>
      </section>

      ${RecordsTable({ app, records: state.records, title: app.t('records.records.tournamentTitle'), emptyLabel: app.t('records.records.tournamentEmpty'), scope: 'tournament' })}

      <section class="records-card records-broken-actions">
        <div class="records-section-header">
          <div>
            <h2>${escapeHtml(app.t('records.broken.actionsTitle'))}</h2>
            <p class="ffta-muted">${escapeHtml(app.t('records.broken.actionsHelp'))}</p>
          </div>
          <div class="records-button-row">
            <button type="button" class="cp-btn" data-action="checkBrokenRecords" ${state.isSaving ? 'disabled' : ''}>${escapeHtml(app.t('records.actions.checkBrokenRecords'))}</button>
            <button type="button" class="cp-btn cp-btn--primary" data-action="updateGlobalRecordsFromBroken" ${state.isSaving ? 'disabled' : ''}>${escapeHtml(app.t('records.actions.updateGlobalRecords'))}</button>
          </div>
        </div>
      </section>

      ${(state.brokenRecords ?? []).length ? `<div class="cp-alert cp-alert--success">${escapeHtml(app.t('records.broken.celebration').replace('{count}', String(state.brokenRecords.length)))}</div>` : ''}
      ${BrokenRecordsTable({ app, records: state.brokenRecords })}
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
