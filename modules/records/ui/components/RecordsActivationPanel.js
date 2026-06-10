export function RecordsActivationPanel({ app, state }) {
  const codes = state.recordCodes ?? [];
  const defaultCodes = codes.map((item) => item.areaCode).filter(Boolean).join(', ');
  const rows = codes.length
    ? codes.map((item) => `
      <tr>
        <td>${escapeHtml(item.areaCode)}</td>
        <td>${escapeHtml(item.areaName ?? item.areaCode)}</td>
        <td>${Number(item.team ?? 0) ? escapeHtml(app.t('records.labels.yes')) : escapeHtml(app.t('records.labels.no'))}</td>
        <td>${Number(item.para ?? 0) ? escapeHtml(app.t('records.labels.yes')) : escapeHtml(app.t('records.labels.no'))}</td>
        <td class="records-num">${escapeHtml(item.recordsCount ?? 0)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="5" class="records-empty">${escapeHtml(app.t('records.activation.empty'))}</td></tr>`;

  return `
    <section class="records-card records-activation">
      <h2>${escapeHtml(app.t('records.activation.title'))}</h2>
      <p class="ffta-muted">${escapeHtml(app.t('records.activation.help'))}</p>
      <form class="records-activation-form" data-records-activation-form>
        <label class="records-field">
          <span>${escapeHtml(app.t('records.activation.codes'))}</span>
          <input name="recordCodes" value="${escapeHtml(defaultCodes)}" placeholder="FR, ER, WR" />
        </label>
        <div class="records-inline-fields">
          <label><input type="checkbox" name="team" /> ${escapeHtml(app.t('records.config.team'))}</label>
          <label><input type="checkbox" name="para" /> ${escapeHtml(app.t('records.config.para'))}</label>
        </div>
        <button type="button" class="ffta-button ffta-button--primary" data-action="activateTournamentRecords" ${state.isSaving ? 'disabled' : ''}>${escapeHtml(app.t('records.activation.activate'))}</button>
      </form>
      <div class="records-table-wrap records-activation__codes">
        <table class="cp-table records-table">
          <thead><tr>
            <th>${escapeHtml(app.t('records.columns.area'))}</th>
            <th>${escapeHtml(app.t('records.columns.name'))}</th>
            <th>${escapeHtml(app.t('records.config.team'))}</th>
            <th>${escapeHtml(app.t('records.config.para'))}</th>
            <th>${escapeHtml(app.t('records.stats.records'))}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
