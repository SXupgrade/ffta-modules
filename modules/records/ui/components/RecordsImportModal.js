import { CpModal } from '../../../../core/ui/components/CpModal.js';

export function RecordsImportModal({ app, vm }) {
  const modal = CpModal({
    id: 'records-import-modal',
    title: app.t('records.import.title'),
    body: buildBody(app),
    footer: buildFooter(app)
  });

  const textarea = modal.el.querySelector('[data-records-import-text]');
  const preview = modal.el.querySelector('[data-records-import-preview]');
  const fileInput = modal.el.querySelector('[data-records-import-file]');

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      textarea.value = await file.text();
      const result = vm.previewImport(textarea.value, 'csv');
      preview.innerHTML = buildPreview(app, result);
    } catch (error) {
      preview.innerHTML = `<div class="records-warning records-warning--error">${escapeHtml(error.message || String(error))}</div>`;
    }
  });

  modal.el.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    if (action === 'previewImport') {
      try {
        const result = vm.previewImport(textarea.value);
        preview.innerHTML = buildPreview(app, result);
      } catch (error) {
        preview.innerHTML = `<div class="records-warning records-warning--error">${escapeHtml(error.message || String(error))}</div>`;
      }
    }

    if (action === 'confirmImport') {
      const form = modal.el.querySelector('[data-records-import-form]');
      const options = Object.fromEntries(new FormData(form).entries());
      options.team = form.querySelector('[name="team"]')?.checked ? 1 : 0;
      options.para = form.querySelector('[name="para"]')?.checked ? 1 : 0;
      try {
        await vm.importPreviewedRecords(options);
        modal.close();
      } catch (error) {
        preview.innerHTML = `<div class="records-warning records-warning--error">${escapeHtml(error.message || String(error))}</div>`;
      }
    }
  });
}

function buildBody(app) {
  return `
    <form class="records-import-form" data-records-import-form>
      <div class="records-inline-fields">
        <label class="records-field"><span>${escapeHtml(app.t('records.config.areaCode'))}</span><input name="areaCode" value="" placeholder="RECORD" /></label>
        <label><input type="checkbox" name="team" /> ${escapeHtml(app.t('records.config.team'))}</label>
        <label><input type="checkbox" name="para" /> ${escapeHtml(app.t('records.config.para'))}</label>
      </div>
      <label class="records-field">
        <span>${escapeHtml(app.t('records.import.file'))}</span>
        <input type="file" accept=".csv,text/csv" data-records-import-file />
      </label>
      <label class="records-field">
        <span>${escapeHtml(app.t('records.import.content'))}</span>
        <textarea data-records-import-text spellcheck="false" placeholder="recordCode;recordLabel;category;categoryName;total;maxScore;tieBreaker;holderName;holderClubOrCountry;place;date;isTeam;isMixed;isPara\nRECORD;TAE National;S1HCL;Sénior 1 Homme Classique;675;720;32;DUPONT Jean;1300000;Aix-en-Provence;2026-01-01;0;0;0"></textarea>
      </label>
      <p class="ffta-muted">${escapeHtml(app.t('records.import.help'))}</p>
      <div data-records-import-preview class="records-import-preview"></div>
    </form>
  `;
}

function buildFooter(app) {
  return `
    <button type="button" class="ffta-button" data-action="previewImport">${escapeHtml(app.t('records.import.preview'))}</button>
    <button type="button" class="ffta-button ffta-button--primary" data-action="confirmImport">${escapeHtml(app.t('records.import.confirm'))}</button>
  `;
}

function buildPreview(app, result) {
  return `
    <div class="records-preview-summary">
      <strong>${result.validRows.length}</strong> ${escapeHtml(app.t('records.import.validRows'))}
      ${result.errors.length ? ` · <strong>${result.errors.length}</strong> ${escapeHtml(app.t('records.import.errors'))}` : ''}
    </div>
    ${result.validRows.length ? buildPreviewTable(app, result.validRows.slice(0, 8)) : ''}
    ${result.errors.length ? `<ul>${result.errors.slice(0, 5).map((error) => `<li>${escapeHtml(error.message)}</li>`).join('')}</ul>` : ''}
  `;
}

function buildPreviewTable(app, rows) {
  return `
    <table class="ffta-table records-preview-table">
      <thead><tr>
        <th>${escapeHtml(app.t('records.columns.area'))}</th>
        <th>${escapeHtml(app.t('records.columns.distance'))}</th>
        <th>${escapeHtml(app.t('records.columns.category'))}</th>
        <th>${escapeHtml(app.t('records.columns.total'))}</th>
        <th>${escapeHtml(app.t('records.columns.athlete'))}</th>
      </tr></thead>
      <tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.recordCode)}</td><td>${escapeHtml(row.distance)}</td><td>${escapeHtml(row.category)}</td><td>${escapeHtml(row.total)}</td><td>${escapeHtml(row.archer)}</td></tr>`).join('')}</tbody>
    </table>
  `;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
