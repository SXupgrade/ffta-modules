export function mountAchievementsPage({ root, vm, app }) {
  vm = vm || getOptionalService(app, 'achievements.vm');
  if (!vm) {
    root.innerHTML = `<div class="ffta-page"><div class="cp-alert cp-alert--danger">${escapeHtml(app?.t?.('app.errors.moduleUnavailable') || 'Module unavailable: view model was not initialized.')}</div></div>`;
    return function unmount() {};
  }
  let unsubscribe = null;

  function render() {
    root.innerHTML = buildHtml(vm, app);
  }

  function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'scan') vm.scanDatabase();
    if (action === 'reset-events') vm.resetEvents();
    if (action === 'add-event') vm.addEvent(event.target.closest('[data-event-type]')?.dataset.eventType);
    if (action === 'select-category') vm.selectCategory(event.target.closest('[data-category]')?.dataset.category);
  }

  unsubscribe = vm.state.__store ? vm.state.__store.subscribe(render) : null;
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
    <section class="ffta-page achievements-page">
      <div class="ffta-page__header achievements-hero">
        <div>
          <p class="achievements-kicker">${escapeHtml(app.t('achievements.kicker'))}</p>
          <h1>${escapeHtml(app.t('achievements.title'))}</h1>
          <p class="ffta-muted">${escapeHtml(app.t('achievements.description'))}</p>
        </div>
        <span class="ffta-badge achievements-badge">${escapeHtml(app.t('achievements.badge'))}</span>
      </div>

      ${state.error ? `<div class="cp-alert cp-alert--danger">${escapeHtml(state.error)}</div>` : ''}

      <div class="achievements-toolbar cp-card">
        <div>
          <strong>${escapeHtml(app.t('achievements.toolbar.title'))}</strong>
          <p>${escapeHtml(app.t('achievements.toolbar.description'))}</p>
        </div>
        <div class="achievements-actions">
          <button type="button" class="cp-button cp-button--primary" data-action="scan" ${state.isLoading ? 'disabled' : ''}>${escapeHtml(app.t(state.isLoading ? 'achievements.actions.scanning' : 'achievements.actions.scan'))}</button>
          <button type="button" class="cp-button" data-action="reset-events">${escapeHtml(app.t('achievements.actions.resetEvents'))}</button>
        </div>
      </div>

      <div class="achievements-summary">
        ${summaryCard(app.t('achievements.summary.unlocked'), `${state.summary.unlocked}/${state.summary.total}`)}
        ${summaryCard(app.t('achievements.summary.progress'), `${state.summary.percent}%`)}
        ${summaryCard(app.t('achievements.summary.tournaments'), state.metrics.tournamentCount ?? '—')}
        ${summaryCard(app.t('achievements.summary.entries'), state.metrics.totalEntryCount ?? state.metrics.entryCount ?? '—')}
      </div>

      <div class="achievements-layout">
        <main class="achievements-main cp-card">
          <div class="achievements-section-title">
            <div>
              <h2>${escapeHtml(app.t('achievements.sections.checklist'))}</h2>
              <p>${escapeHtml(app.t('achievements.sections.checklistHelp'))}</p>
            </div>
            ${buildCategoryTabs(vm, app)}
          </div>
          <div class="achievements-grid">
            ${vm.getVisibleAchievements().map((achievement) => buildAchievementCard(achievement, app)).join('')}
          </div>
        </main>

        <aside class="achievements-side">
          ${buildMetricsCard(state, app)}
          ${buildEventsCard(vm, app)}
        </aside>
      </div>
    </section>
  `;
}

function summaryCard(label, value) {
  return `<article class="cp-card achievements-summary-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function buildCategoryTabs(vm, app) {
  return `<div class="achievements-tabs">${vm.getCategoriesList().map((category) => `
    <button type="button" class="achievements-tab ${vm.state.selectedCategory === category ? 'is-active' : ''}" data-action="select-category" data-category="${escapeAttribute(category)}">
      ${escapeHtml(app.t(`achievements.categories.${category}`))}
    </button>
  `).join('')}</div>`;
}

function buildAchievementCard(achievement, app) {
  const statusKey = achievement.unlocked ? 'achievements.status.unlocked' : 'achievements.status.locked';
  return `
    <article class="achievements-card ${achievement.unlocked ? 'is-unlocked' : ''}">
      <div class="achievements-card-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
      <div class="achievements-card-body">
        <div class="achievements-card-head">
          <span class="achievements-level achievements-level--${escapeAttribute(achievement.level)}">${escapeHtml(buildLevelLabel(achievement, app))}</span>
          <span class="achievements-status">${escapeHtml(app.t(statusKey))}</span>
        </div>
        <h3>${escapeHtml(app.t(`achievements.${achievement.titleKey}`))}</h3>
        <p>${escapeHtml(app.t(`achievements.${achievement.descriptionKey}`))}</p>
        <div class="achievements-progress" aria-label="${escapeAttribute(`${achievement.progress}%`)}">
          <span style="width:${achievement.progress}%"></span>
        </div>
        <small>${escapeHtml(achievement.current)} / ${escapeHtml(achievement.target)}</small>
      </div>
    </article>
  `;
}

function buildMetricsCard(state, app) {
  const metrics = state.metrics || {};
  const rows = [
    ['scanScope', app.t(`achievements.scanScopes.${metrics.scanScope || 'current'}`)],
    ['tournaments', metrics.tournamentCount ?? 0],
    ['annual2026', metrics.tournamentCount2026 ?? 0],
    ['entries', metrics.totalEntryCount ?? metrics.entryCount ?? 0],
    ['maxEntries', metrics.maxEntriesInTournament ?? 0],
    ['assigned', metrics.assignedEntryCount ?? 0],
    ['scored', metrics.scoredEntryCount ?? 0],
    ['ranked', metrics.rankedEntryCount ?? 0],
    ['sessions', metrics.maxSessionCount ?? metrics.sessionCount ?? 0],
    ['divisions', metrics.maxDivisionCount ?? metrics.divisionCount ?? 0],
    ['clubs', metrics.maxClubCount ?? 0]
  ];
  return `
    <article class="cp-card achievements-metrics-card">
      <h2>${escapeHtml(app.t('achievements.sections.scan'))}</h2>
      <p>${escapeHtml(app.t('achievements.sections.scanHelp'))}</p>
      <div class="achievements-metric-list">
        ${rows.map(([key, value]) => `<div><span>${escapeHtml(app.t(`achievements.metrics.${key}`))}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}
      </div>
    </article>
  `;
}

function buildEventsCard(vm, app) {
  const events = vm.state.events || [];
  return `
    <article class="cp-card achievements-events-card">
      <h2>${escapeHtml(app.t('achievements.sections.events'))}</h2>
      <p>${escapeHtml(app.t('achievements.sections.eventsHelp'))}</p>
      <div class="achievements-event-buttons">
        ${vm.demoEvents.map((type) => `
          <button type="button" class="cp-button" data-action="add-event" data-event-type="${escapeAttribute(type)}">
            ${escapeHtml(app.t(`achievements.events.${type}`))}
          </button>
        `).join('')}
      </div>
      <div class="achievements-event-log">
        ${events.length ? events.slice().reverse().slice(0, 8).map((event) => `<div><strong>${escapeHtml(event.type)}</strong><span>${escapeHtml(formatDate(event.occurredAt))}</span></div>`).join('') : `<p class="ffta-muted">${escapeHtml(app.t('achievements.events.empty'))}</p>`}
      </div>
    </article>
  `;
}

function buildLevelLabel(achievement, app) {
  const level = app.t(`achievements.levels.${achievement.level}`);
  return achievement.isTiered ? app.t('achievements.levels.tier', { level, tier: achievement.tier }) : level;
}

function formatDate(value) {
  if (!value) return '—';
  try { return new Date(value).toLocaleString(); } catch { return value; }
}


function getOptionalService(app, serviceId) {
  try {
    return app?.services?.get?.(serviceId) || null;
  } catch (error) {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
