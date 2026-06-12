export function RecordsConfigPanel({ app, state }) {
  const firstArea = state.monitoredRecords[0] ?? {};
  const areaCode = firstArea.areaCode ?? 'FFTA';
  const areaName = firstArea.areaName ?? 'FFTA Records';
  return `
    <form class="records-card records-config" data-records-config-form>
      <h2>${escapeHtml(app.t('records.config.title'))}</h2>
      <p class="ffta-muted">${escapeHtml(app.t('records.config.help'))}</p>
      <label class="records-field">
        <span>${escapeHtml(app.t('records.config.areaCode'))}</span>
        <input name="areaCode" value="${escapeHtml(areaCode)}" maxlength="20" />
      </label>
      <label class="records-field">
        <span>${escapeHtml(app.t('records.config.areaName'))}</span>
        <input name="areaName" value="${escapeHtml(areaName)}" maxlength="50" />
      </label>
      <div class="records-inline-fields">
        <label><input type="checkbox" name="team" ${Number(firstArea.team ?? 0) ? 'checked' : ''} /> ${escapeHtml(app.t('records.config.team'))}</label>
        <label><input type="checkbox" name="para" ${Number(firstArea.para ?? 0) ? 'checked' : ''} /> ${escapeHtml(app.t('records.config.para'))}</label>
      </div>
      <div class="records-inline-fields">
        <label class="records-field">
          <span>${escapeHtml(app.t('records.config.headerCode'))}</span>
          <input name="headerCode" value="${escapeHtml(firstArea.headerCode ?? '')}" maxlength="2" />
        </label>
        <label class="records-field">
          <span>${escapeHtml(app.t('records.config.header'))}</span>
          <input name="header" value="${escapeHtml(firstArea.header ?? areaName)}" maxlength="25" />
        </label>
      </div>
      <button type="button" class="cp-btn cp-btn--primary" data-action="saveMonitor">${escapeHtml(app.t('records.config.save'))}</button>
    </form>
  `;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
