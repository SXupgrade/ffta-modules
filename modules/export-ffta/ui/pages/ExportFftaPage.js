export function mountExportFftaPage({ root, vm, app }) {
  const localVm = vm || app.services.get('export-ffta.vm');
  const unsubscribe = localVm.state.__store?.subscribe(render) ?? null;

  function render() { root.innerHTML = buildHtml(localVm.state, app, localVm); }

  function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'tab') localVm.setTab(event.target.closest('[data-tab]')?.dataset.tab || 'export');
    if (action === 'download-active-export') localVm.downloadActiveExport();
    if (action === 'run-active-tnr') localVm.runActiveTnr();
    if (action === 'run-dataset-tnr') localVm.runDatasetTnr();
  }

  function handleChange(event) {
    const field = event.target.closest('[data-field]')?.dataset.field;
    if (field === 'level') localVm.setLevel(event.target.value);
    if (field === 'expectedFile') localVm.setExpectedFile(event.target.value);
    if (field === 'datasetFile') localVm.setDatasetFile(event.target.value);
  }

  root.addEventListener('click', handleClick);
  root.addEventListener('change', handleChange);
  render();
  localVm.load().catch(() => {});

  return function unmountExportFftaPage() {
    if (unsubscribe) unsubscribe();
    root.removeEventListener('click', handleClick);
    root.removeEventListener('change', handleChange);
  };
}

function buildHtml(state, app, vm) {
  // UX v0.2.14 : les onglets de non-regression sont des outils developpeur,
  // masques hors mode dev. L'ecran par defaut = telecharger le fichier FFTA.
  const active = app.dev?.enabled ? (state.activeTab || 'export') : 'export';
  return `
    <section class="ffta-page export-ffta-page">
      <div class="export-ffta-hero">
        <div>
          <p class="export-ffta-eyebrow">FFTA</p>
          <h1>${escapeHtml(app.t('exportFfta.title'))}</h1>
          <p>${escapeHtml(app.t('exportFfta.subtitle'))}</p>
        </div>
      </div>

      ${app.dev?.enabled ? `<div class="export-ffta-tabs">
        ${tabButton(app, active, 'export', app.t('exportFfta.tabs.export'))}
        ${tabButton(app, active, 'tnrActive', app.t('exportFfta.tabs.tnrActive'))}
        ${tabButton(app, active, 'tnrDataset', app.t('exportFfta.tabs.tnrDataset'))}
      </div>` : ''}

      ${state.error ? `<div class="ffta-badge ffta-badge--error">${escapeHtml(state.error)}</div>` : ''}
      ${active === 'export' ? buildExportTab(state, app, vm) : ''}
      ${active === 'tnrActive' ? buildActiveTnrTab(state, app) : ''}
      ${active === 'tnrDataset' ? buildDatasetTnrTab(state, app) : ''}
      ${buildReport(state, app)}
    </section>
  `;
}

function tabButton(app, active, id, label) {
  return `<button type="button" class="export-ffta-tab ${active === id ? 'is-active' : ''}" data-action="tab" data-tab="${escapeAttribute(id)}">${escapeHtml(label)}</button>`;
}

function buildLevelSelect(state, app) {
  return `<label class="export-ffta-field"><span>${escapeHtml(app.t('exportFfta.fields.level'))}</span><select data-field="level">
    ${['S', 'SP', 'N'].map((level) => `<option value="${level}" ${state.level === level ? 'selected' : ''}>${escapeHtml(app.t(`exportFfta.levels.${level}`))}</option>`).join('')}
  </select></label>`;
}

function buildExportTab(state, app, vm) {
  return `<article class="cp-card export-ffta-card">
    <h2>${escapeHtml(app.t('exportFfta.cards.exportTitle'))}</h2>
    <p>${escapeHtml(app.t('exportFfta.cards.exportText'))}</p>
    <div class="export-ffta-form">${buildLevelSelect(state, app)}</div>
    <button type="button" class="cp-button cp-button--primary" data-action="download-active-export" ${state.isLoading ? 'disabled' : ''}>${escapeHtml(app.t('exportFfta.actions.download'))}</button>
  </article>`;
}

function buildActiveTnrTab(state, app) {
  return `<article class="cp-card export-ffta-card">
    <h2>${escapeHtml(app.t('exportFfta.cards.tnrActiveTitle'))}</h2>
    <p>${escapeHtml(app.t('exportFfta.cards.tnrActiveText'))}</p>
    <div class="export-ffta-form">
      ${buildLevelSelect(state, app)}
      <label class="export-ffta-field"><span>${escapeHtml(app.t('exportFfta.fields.expected'))}</span><input type="text" data-field="expectedFile" value="${escapeAttribute(state.expectedFile)}"></label>
    </div>
    <button type="button" class="cp-button cp-button--primary" data-action="run-active-tnr" ${state.isLoading ? 'disabled' : ''}>${escapeHtml(app.t('exportFfta.actions.runTnr'))}</button>
  </article>`;
}

function buildDatasetTnrTab(state, app) {
  return `<article class="cp-card export-ffta-card">
    <h2>${escapeHtml(app.t('exportFfta.cards.tnrDatasetTitle'))}</h2>
    <p>${escapeHtml(app.t('exportFfta.cards.tnrDatasetText'))}</p>
    <div class="export-ffta-form">
      <label class="export-ffta-field"><span>${escapeHtml(app.t('exportFfta.fields.dataset'))}</span><select data-field="datasetFile">
        ${(state.datasets || []).map((name) => `<option value="${escapeAttribute(name)}" ${state.datasetFile === name ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')}
      </select></label>
    </div>
    <button type="button" class="cp-button cp-button--primary" data-action="run-dataset-tnr" ${state.isLoading ? 'disabled' : ''}>${escapeHtml(app.t('exportFfta.actions.runDataset'))}</button>
  </article>`;
}

function buildReport(state, app) {
  if (!state.report) return '';
  const report = state.report;
  const statusKey = report.success ? 'success' : (report.missingExpected ? 'missingExpected' : 'failure');
  const diff = report.firstDifference;
  return `<article class="cp-card export-ffta-report ${report.success ? 'is-success' : 'is-failure'}">
    <h2>${escapeHtml(app.t('exportFfta.report.summary'))}</h2>
    <p><strong>${escapeHtml(app.t(`exportFfta.status.${statusKey}`))}</strong></p>
    <p class="ffta-muted">${escapeHtml(report.expectedFile || '')} — ${Number(report.expectedLineCount || 0)} ${escapeHtml(app.t('exportFfta.report.lines'))} / ${Number(report.generatedLineCount || 0)} ${escapeHtml(app.t('exportFfta.report.lines'))}</p>
    ${diff ? `<div class="export-ffta-diff"><h3>${escapeHtml(app.t('exportFfta.report.firstDifference'))} #${diff.line}</h3><p><strong>${escapeHtml(app.t('exportFfta.report.expected'))}</strong><br><code>${escapeHtml(diff.expected)}</code></p><p><strong>${escapeHtml(app.t('exportFfta.report.generated'))}</strong><br><code>${escapeHtml(diff.generated)}</code></p></div>` : ''}
  </article>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttribute(value) { return escapeHtml(value).replace(/"/g, '&quot;'); }
