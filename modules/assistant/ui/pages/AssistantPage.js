export function mountAssistantPage({ root, vm, app }) {
  vm = vm || getOptionalService(app, 'assistant.vm');
  if (!vm) {
    root.innerHTML = `<div class="ffta-page"><div class="cp-alert cp-alert--danger">${escapeHtml(app?.t?.('app.errors.moduleUnavailable') || 'Module unavailable: view model was not initialized.')}</div></div>`;
    return function unmount() {};
  }

  function render() { root.innerHTML = buildHtml(vm, app); }

  function handleClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'scan') vm.scanDatabase();
    if (action === 'reset') vm.resetChecklist();
    if (action === 'print') window.print();
    if (action === 'phase') vm.selectPhase(button.dataset.phase);
    if (action === 'status') vm.setStatus(button.dataset.itemId, button.dataset.status);
    if (action === 'add-event') vm.addEvent(button.dataset.eventType);
  }

  const unsubscribe = vm.state.__store ? vm.state.__store.subscribe(render) : null;
  root.addEventListener('click', handleClick);
  render();
  if (!vm.state.metrics?.scannedAt) vm.scanDatabase();

  return function unmount() {
    if (unsubscribe) unsubscribe();
    root.removeEventListener('click', handleClick);
  };
}

function buildHtml(vm, app) {
  const state = vm.state;
  return `
    <section class="ffta-page assistant-page">
      <div class="ffta-page__header assistant-hero">
        <div>
          <p class="assistant-kicker">${escapeHtml(app.t('assistant.kicker'))}</p>
          <h1>${escapeHtml(app.t('assistant.title'))}</h1>
          <p class="ffta-muted">${escapeHtml(app.t('assistant.description'))}</p>
        </div>
        <span class="ffta-badge assistant-badge">${escapeHtml(app.t('assistant.badge'))}</span>
      </div>

      ${state.error ? `<div class="cp-alert cp-alert--danger">${escapeHtml(state.error)}</div>` : ''}

      <div class="assistant-summary">
        ${summaryCard(app.t('assistant.summary.total'), `${state.summary.done}/${state.summary.total}`)}
        ${summaryCard(app.t('assistant.summary.progress'), `${state.summary.percent}%`)}
        ${summaryCard(app.t('assistant.summary.mandatory'), `${state.summary.mandatoryDone}/${state.summary.mandatory}`)}
        ${summaryCard(app.t('assistant.summary.remaining'), state.summary.remainingMandatory)}
      </div>

      <div class="assistant-toolbar cp-card">
        <div>
          <strong>${escapeHtml(app.t('assistant.toolbar.title'))}</strong>
          <p>${escapeHtml(app.t('assistant.toolbar.description'))}</p>
        </div>
        <div class="assistant-actions">
          <button type="button" class="cp-button cp-button--primary" data-action="scan" ${state.isLoading ? 'disabled' : ''}>${escapeHtml(app.t(state.isLoading ? 'assistant.actions.scanning' : 'assistant.actions.scan'))}</button>
          <button type="button" class="cp-button" data-action="print">${escapeHtml(app.t('assistant.actions.print'))}</button>
          <button type="button" class="cp-button" data-action="reset">${escapeHtml(app.t('assistant.actions.reset'))}</button>
        </div>
      </div>

      <div class="assistant-print-header">
        <h2>${escapeHtml(app.t('assistant.print.title'))}</h2>
        <p>${escapeHtml(app.t('assistant.print.description'))}</p>
      </div>

      <div class="assistant-layout">
        <main class="assistant-main cp-card">
          <div class="assistant-section-title">
            <div>
              <h2>${escapeHtml(app.t('assistant.sections.timeline'))}</h2>
              <p>${escapeHtml(app.t('assistant.sections.timelineHelp'))}</p>
            </div>
            ${buildPhaseTabs(vm, app)}
          </div>
          ${buildTimeline(vm, app)}
        </main>

        <aside class="assistant-side">
          ${buildMetricsCard(state, app)}
          ${buildEventsCard(vm, app)}
        </aside>
      </div>
    </section>
  `;
}

function buildPhaseTabs(vm, app) {
  return `<div class="assistant-tabs">${vm.getPhaseTabs().map((phase) => `
    <button type="button" class="assistant-tab ${vm.state.selectedPhase === phase ? 'is-active' : ''}" data-action="phase" data-phase="${escapeAttribute(phase)}">
      ${escapeHtml(app.t(`assistant.phases.${phase}`))}
    </button>
  `).join('')}</div>`;
}

function buildTimeline(vm, app) {
  return `<div class="assistant-timeline">${vm.getTimeline().map((phase) => {
    if (!phase.items.length) return '';
    return `<section class="assistant-phase">
      <div class="assistant-phase__marker"></div>
      <div class="assistant-phase__body">
        <h3>${escapeHtml(app.t(`assistant.phases.${phase.id}`))}</h3>
        <div class="assistant-items">${phase.items.map((item) => buildItem(item, app)).join('')}</div>
      </div>
    </section>`;
  }).join('')}</div>`;
}

function buildItem(item, app) {
  const statusLabel = item.isAutomatic ? app.t('assistant.status.auto') : app.t(`assistant.status.${item.status}`);
  return `
    <article class="assistant-item is-${escapeAttribute(item.status)} ${item.priority === 'mandatory' ? 'is-mandatory' : 'is-optional'}">
      <div class="assistant-item__head">
        <div>
          <span class="assistant-timing">${escapeHtml(item.timing)}</span>
          <span class="assistant-priority">${escapeHtml(app.t(`assistant.priority.${item.priority}`))}</span>
        </div>
        <span class="assistant-status">${escapeHtml(statusLabel)}</span>
      </div>
      <h4>${escapeHtml(app.t(`assistant.${item.titleKey}`))}</h4>
      <p>${escapeHtml(app.t(`assistant.${item.descriptionKey}`))}</p>
      <details class="assistant-tooltip">
        <summary>${escapeHtml(app.t('assistant.labels.where'))}</summary>
        <p>${escapeHtml(app.t(`assistant.${item.tooltipKey}`))}</p>
      </details>
      <div class="assistant-item__actions">
        ${item.linkModuleId ? `<a class="cp-btn cp-btn--ghost" href="#/${escapeAttribute(item.linkModuleId)}">${escapeHtml(app.t('assistant.actions.goto'))}</a>` : ''}
        <button type="button" class="cp-button ${item.status === 'done' ? 'cp-button--primary' : ''}" data-action="status" data-item-id="${escapeAttribute(item.id)}" data-status="done">${escapeHtml(app.t('assistant.actions.done'))}</button>
        <button type="button" class="cp-button ${item.status === 'na' ? 'cp-button--primary' : ''}" data-action="status" data-item-id="${escapeAttribute(item.id)}" data-status="na">${escapeHtml(app.t('assistant.actions.na'))}</button>
        <button type="button" class="cp-button" data-action="status" data-item-id="${escapeAttribute(item.id)}" data-status="todo">${escapeHtml(app.t('assistant.actions.todo'))}</button>
      </div>
    </article>
  `;
}

function buildMetricsCard(state, app) {
  const metrics = state.metrics || {};
  const rows = [
    ['tournament', metrics.tournamentName || metrics.tournamentCode || '—'],
    ['entries', metrics.entryCount ?? 0],
    ['assigned', metrics.assignedEntryCount ?? 0],
    ['scores', metrics.scoredEntryCount ?? 0],
    ['ranked', metrics.rankedEntryCount ?? 0],
    ['judge', metrics.responsibleJudgeCount ?? 0]
  ];
  return `<article class="cp-card assistant-card">
    <h2>${escapeHtml(app.t('assistant.sections.scan'))}</h2>
    <p>${escapeHtml(app.t('assistant.sections.scanHelp'))}</p>
    <div class="assistant-metrics">${rows.map(([key, value]) => `<div><span>${escapeHtml(app.t(`assistant.metrics.${key}`))}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>
  </article>`;
}

function buildEventsCard(vm, app) {
  return `<article class="cp-card assistant-card">
    <h2>${escapeHtml(app.t('assistant.sections.events'))}</h2>
    <p>${escapeHtml(app.t('assistant.sections.eventsHelp'))}</p>
    <div class="assistant-event-buttons">${vm.demoEvents.map((type) => `<button type="button" class="cp-button" data-action="add-event" data-event-type="${escapeAttribute(type)}">${escapeHtml(app.t(`assistant.events.${type}`))}</button>`).join('')}</div>
  </article>`;
}

function summaryCard(label, value) {
  return `<article class="cp-card assistant-summary-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function getOptionalService(app, serviceId) {
  try { return app?.services?.get?.(serviceId) || null; } catch { return null; }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function escapeAttribute(value) { return escapeHtml(value); }
