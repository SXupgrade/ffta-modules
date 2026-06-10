import { RecordsHeader } from '../components/RecordsHeader.js';
import { RecordsToolbar } from '../components/RecordsToolbar.js';
import { RecordsCurrentTournamentPanel } from '../components/RecordsCurrentTournamentPanel.js';
import { RecordsStandingsPanel } from '../components/RecordsStandingsPanel.js';
import { RecordsImportModal } from '../components/RecordsImportModal.js';
import { RecordsEditModal } from '../components/RecordsEditModal.js';
import { CpLoader } from '../../../../core/ui/components/CpLoader.js';

export function mountRecordsPage({ root, vm, app }) {
  vm = vm || app.services.get('records.vm');
  let unsubscribe;
  let activeView = 'current';

  function render() {
    root.innerHTML = buildHtml(vm.state, app, activeView);
  }

  async function handleAction(event) {
    const button = event.target.closest('[data-action]');
    const action = button?.dataset.action;
    if (!action) return;

    if (action === 'switchView') {
      activeView = button.dataset.view || 'current';
      render();
      return;
    }

    if (action === 'reload') vm.load().catch(() => {});
    if (action === 'exportJson') vm.exportJson();
    if (action === 'exportCsv') vm.exportCsv();
    if (action === 'openImport') RecordsImportModal({ app, vm });

    if (action === 'editRecord') {
      const scope = button.dataset.recordScope || 'global';
      const index = Number.parseInt(button.dataset.recordIndex || '-1', 10);
      const list = scope === 'tournament' ? vm.state.records : vm.state.globalRecords;
      const record = list?.[index];
      if (record) RecordsEditModal({ app, vm, record, scope });
    }
    if (action === 'checkBrokenRecords') vm.checkBrokenRecords().catch(() => {});
    if (action === 'updateGlobalRecordsFromBroken') vm.updateGlobalRecordsFromBroken().catch(() => {});

    if (action === 'syncTournamentRecordAreas') {
      const form = root.querySelector('[data-records-area-selector]');
      const selectedAreaCodes = Array.from(form?.querySelectorAll('[name="areaCode"]:checked') ?? []).map((input) => input.value);
      vm.syncTournamentRecordAreas(selectedAreaCodes).catch(() => {});
    }

    if (action === 'saveRecordArea') {
      const form = root.querySelector('[data-records-area-form]');
      const input = Object.fromEntries(new FormData(form).entries());
      vm.saveRecordArea(input).catch(() => {});
    }

    if (action === 'deleteRecordArea') {
      const areaCode = button.dataset.areaCode;
      if (!areaCode) return;
      const message = app.t('records.standings.confirmDelete').replace('{code}', areaCode);
      if (window.confirm(message)) vm.deleteRecordArea(areaCode).catch(() => {});
    }
  }

  unsubscribe = vm.state.__store ? vm.state.__store.subscribe(render) : null;
  root.addEventListener('click', handleAction);
  render();
  vm.load().catch(() => {});

  return function unmount() {
    if (unsubscribe) unsubscribe();
    root.removeEventListener('click', handleAction);
  };
}

function buildHtml(state, app, activeView) {
  const tournamentName = state.tournament?.name ?? state.tournament?.code ?? '';
  const body = state.isLoading
    ? CpLoader({ label: app.t('records.messages.loading') })
    : `
      ${buildWarnings(state)}
      ${buildStats(state, app)}
      ${buildTabs(app, activeView)}
      ${activeView === 'standings'
        ? RecordsStandingsPanel({ app, state })
        : RecordsCurrentTournamentPanel({ app, state })}
    `;

  return `
    <section class="ffta-page records-page">
      ${RecordsHeader({ app, title: app.t('records.title'), tournamentName })}
      ${RecordsToolbar({ app, state })}
      ${state.error ? `<div class="records-error ffta-badge ffta-badge--error">${escapeHtml(state.error)}</div>` : ''}
      <div class="records-page__body">${body}</div>
    </section>
  `;
}

function buildTabs(app, activeView) {
  return `
    <div class="records-tabs" role="tablist">
      <button type="button" class="records-tab ${activeView === 'current' ? 'records-tab--active' : ''}" data-action="switchView" data-view="current">${escapeHtml(app.t('records.tabs.current'))}</button>
      <button type="button" class="records-tab ${activeView === 'standings' ? 'records-tab--active' : ''}" data-action="switchView" data-view="standings">${escapeHtml(app.t('records.tabs.standings'))}</button>
    </div>
  `;
}

function buildStats(state, app) {
  return `
    <div class="records-card records-stats records-stats--compact">
      <div class="records-stat-row"><span>${escapeHtml(app.t('records.stats.areas'))}</span><strong>${state.areas.length}</strong></div>
      <div class="records-stat-row"><span>${escapeHtml(app.t('records.stats.monitored'))}</span><strong>${state.monitoredRecords.length}</strong></div>
      <div class="records-stat-row"><span>${escapeHtml(app.t('records.stats.globalRecords'))}</span><strong>${state.globalRecords.length}</strong></div>
      <div class="records-stat-row"><span>${escapeHtml(app.t('records.stats.records'))}</span><strong>${state.records.length}</strong></div>
      <div class="records-stat-row"><span>${escapeHtml(app.t('records.stats.broken'))}</span><strong>${state.brokenRecords.length}</strong></div>
    </div>
  `;
}

function buildWarnings(state) {
  if (!state.warnings?.length) return '';
  return `<div class="records-warnings">${state.warnings.map((warning) => `<div class="records-warning records-warning--${escapeHtml(warning.level)}">${escapeHtml(warning.message)}</div>`).join('')}</div>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
