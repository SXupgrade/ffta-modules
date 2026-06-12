import { CpModal } from '../../../../core/ui/components/CpModal.js';

export function RecordsEditModal({ app, vm, record, scope }) {
  const modal = CpModal({
    id: 'records-edit-modal',
    title: app.t('records.edit.title'),
    body: buildBody(app, record),
    footer: buildFooter(app)
  });

  const message = modal.el.querySelector('[data-records-edit-message]');

  modal.el.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action !== 'saveRecord') return;

    const form = modal.el.querySelector('[data-records-edit-form]');
    const data = Object.fromEntries(new FormData(form).entries());
    data.isTeam = form.querySelector('[name="isTeam"]')?.checked ? 1 : 0;
    data.isMixed = form.querySelector('[name="isMixed"]')?.checked ? 1 : 0;
    data.isPara = form.querySelector('[name="isPara"]')?.checked ? 1 : 0;

    try {
      await vm.saveRecord({
        scope,
        original: record,
        record: data
      });
      modal.close();
    } catch (error) {
      message.innerHTML = `<div class="records-warning records-warning--error">${escapeHtml(error.message || String(error))}</div>`;
    }
  });
}

function buildBody(app, record) {
  return `
    <form class="records-edit-form" data-records-edit-form>
      <div class="records-edit-grid">
        ${input(app, 'recordCode', record.recordCode ?? record.areaCode, true)}
        ${input(app, 'recordLabel', record.recordLabel ?? record.distance, true)}
        ${input(app, 'category', record.category, true)}
        ${input(app, 'categoryName', record.categoryName)}
        ${input(app, 'total', record.total, true, 'number')}
        ${input(app, 'maxScore', record.maxScore, false, 'number')}
        ${input(app, 'tieBreaker', record.tieBreaker ?? record.xNine, false, 'number')}
        ${input(app, 'holderName', record.holderName)}
        ${input(app, 'holderClubOrCountry', record.holderClubOrCountry)}
        ${input(app, 'place', record.place)}
        ${input(app, 'date', record.date ?? record.recordDate, false, 'date')}
      </div>
      <div class="records-inline-fields">
        ${checkbox(app, 'isTeam', record.isTeam ?? record.team)}
        ${checkbox(app, 'isMixed', record.isMixed ?? record.isDouble)}
        ${checkbox(app, 'isPara', record.isPara ?? record.para)}
      </div>
      <p class="ffta-muted">${escapeHtml(app.t('records.edit.help'))}</p>
      <div data-records-edit-message></div>
    </form>
  `;
}

function input(app, name, value, required = false, type = 'text') {
  return `
    <label class="records-field">
      <span>${escapeHtml(app.t(`records.canonical.${name}`))}</span>
      <input name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" ${required ? 'required' : ''} />
    </label>
  `;
}

function checkbox(app, name, value) {
  return `<label><input type="checkbox" name="${escapeHtml(name)}" ${Number(value ?? 0) ? 'checked' : ''} /> ${escapeHtml(app.t(`records.canonical.${name}`))}</label>`;
}

function buildFooter(app) {
  return `<button type="button" class="cp-btn cp-btn--primary" data-action="saveRecord">${escapeHtml(app.t('records.edit.save'))}</button>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
