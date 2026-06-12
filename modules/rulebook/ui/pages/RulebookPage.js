export function mountRulebookPage({ root, vm, app }) {
  vm = vm || getOptionalService(app, 'rulebook.vm');
  if (!vm) {
    root.innerHTML = `<div class="ffta-page"><div class="cp-alert cp-alert--danger">${escapeHtml(app?.t?.('app.errors.moduleUnavailable') || 'Module unavailable: view model was not initialized.')}</div></div>`;
    return function unmount() {};
  }

  function render() { root.innerHTML = buildHtml(vm, app); }

  function handleInput(event) {
    const input = event.target.closest('[data-rulebook-query]');
    if (!input) return;
    vm.setQuery(input.value);
  }

  function handleClick(event) {
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement) return;
    const action = actionElement.dataset.action;
    if (action === 'discipline') vm.selectDiscipline(actionElement.dataset.discipline);
    if (action === 'entry') vm.selectEntry(actionElement.dataset.entryId);
    if (action === 'favorite') vm.toggleFavorite(actionElement.dataset.entryId);
    if (action === 'favorites-filter') vm.toggleFavoritesFilter();
    if (action === 'open-pdf') window.open(vm.pdfUrl, '_blank', 'noopener,noreferrer');
    if (action === 'open-pdf-page') {
      const page = event.target.closest('[data-page]')?.dataset.page;
      const url = page ? `${vm.pdfUrl}#page=${encodeURIComponent(page)}` : vm.pdfUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  const unsubscribe = vm.state.__store ? vm.state.__store.subscribe(render) : null;
  root.addEventListener('input', handleInput);
  root.addEventListener('click', handleClick);
  render();

  return function unmount() {
    if (unsubscribe) unsubscribe();
    root.removeEventListener('input', handleInput);
    root.removeEventListener('click', handleClick);
  };
}

function buildHtml(vm, app) {
  const stats = vm.getStats();
  const results = vm.getResults();
  const selectedEntry = vm.getSelectedEntry();
  return `
    <section class="ffta-page rulebook-page">
      <div class="ffta-page__header rulebook-hero">
        <div>
          <p class="rulebook-kicker">${escapeHtml(app.t('rulebook.kicker'))}</p>
          <h1>${escapeHtml(app.t('rulebook.title'))}</h1>
          <p class="ffta-muted">${escapeHtml(app.t('rulebook.description'))}</p>
          <p class="ffta-muted ffta-small">${escapeHtml(app.t('rulebook.versionNote', { version: vm.meta?.version || '' }))}</p>
        </div>
        <button type="button" class="cp-button cp-button--primary" data-action="open-pdf">${escapeHtml(app.t('rulebook.actions.openPdf'))}</button>
      </div>

      <div class="rulebook-summary">
        ${summaryCard(app.t('rulebook.summary.version'), vm.meta.version)}
        ${summaryCard(app.t('rulebook.summary.pages'), stats.pages)}
        ${summaryCard(app.t('rulebook.summary.sections'), stats.sections)}
        ${summaryCard(app.t('rulebook.summary.quickRules'), stats.quickRules)}
      </div>

      <div class="rulebook-toolbar cp-card">
        <label class="rulebook-search">
          <span>${escapeHtml(app.t('rulebook.search.label'))}</span>
          <input type="search" data-rulebook-query value="${escapeAttribute(vm.state.query)}" placeholder="${escapeAttribute(app.t('rulebook.search.placeholder'))}" />
        </label>
        <button type="button" class="cp-button ${vm.state.showOnlyFavorites ? 'cp-button--primary' : ''}" data-action="favorites-filter">
          ${escapeHtml(app.t('rulebook.actions.favorites'))} (${escapeHtml(stats.favorites)})
        </button>
      </div>

      <div class="rulebook-layout">
        <aside class="rulebook-side cp-card">
          <h2>${escapeHtml(app.t('rulebook.sections.title'))}</h2>
          <div class="rulebook-section-list">
            ${disciplineButton(app, 'all', app.t('rulebook.disciplines.all'), vm.state.selectedDiscipline)}
            ${vm.sections.map((section) => disciplineButton(app, section.id, app.t(`rulebook.${section.titleKey}`), vm.state.selectedDiscipline, section.page)).join('')}
          </div>
        </aside>

        <main class="rulebook-results cp-card">
          <div class="rulebook-results__header">
            <div>
              <h2>${escapeHtml(app.t('rulebook.results.title'))}</h2>
              <p>${escapeHtml(app.t('rulebook.results.count', { count: results.length }))}</p>
            </div>
          </div>
          <div class="rulebook-result-list">
            ${results.length ? results.map((entry) => resultItem(entry, selectedEntry, app)).join('') : emptyState(app)}
          </div>
        </main>

        <article class="rulebook-detail cp-card">
          ${selectedEntry ? detailView(selectedEntry, vm, app) : emptyState(app)}
        </article>
      </div>
    </section>
  `;
}

function resultItem(entry, selectedEntry, app) {
  const active = selectedEntry?.id === entry.id;
  return `<button type="button" class="rulebook-result ${active ? 'is-active' : ''}" data-action="entry" data-entry-id="${escapeAttribute(entry.id)}">
    <span>${escapeHtml(entry.article)}</span>
    <strong>${escapeHtml(entry.title)}</strong>
    <small>${escapeHtml(app.t('rulebook.labels.page', { page: entry.page }))}</small>
  </button>`;
}

function detailView(entry, vm, app) {
  const isFavorite = (vm.state.favorites || []).includes(entry.id);
  return `
    <div class="rulebook-detail__head">
      <div>
        <span class="rulebook-article">${escapeHtml(entry.article)}</span>
        <h2>${escapeHtml(entry.title)}</h2>
        <p>${escapeHtml(app.t('rulebook.labels.page', { page: entry.page }))} · ${escapeHtml(entry.sourceHint)}</p>
      </div>
      <div class="ffta-actions">
        <button type="button" class="cp-btn cp-btn--primary" data-action="open-pdf-page" data-page="${escapeAttribute(entry.page)}">
          ${escapeHtml(app.t('rulebook.actions.openPdfAtPage', { page: entry.page }))}
        </button>
        <button type="button" class="cp-btn ${isFavorite ? 'cp-btn--primary' : 'cp-btn--secondary'}" data-action="favorite" data-entry-id="${escapeAttribute(entry.id)}">
          ${escapeHtml(app.t(isFavorite ? 'rulebook.actions.removeFavorite' : 'rulebook.actions.addFavorite'))}
        </button>
      </div>
    </div>
    <p class="rulebook-detail__summary">${escapeHtml(entry.summary)}</p>
    <div class="rulebook-tags">${(entry.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
    <div class="rulebook-source-note">
      <strong>${escapeHtml(app.t('rulebook.labels.source'))}</strong>
      <p>${escapeHtml(app.t('rulebook.sourceNote'))}</p>
    </div>
  `;
}

function disciplineButton(app, id, label, selectedId, page = null) {
  return `<button type="button" class="rulebook-section ${selectedId === id ? 'is-active' : ''}" data-action="discipline" data-discipline="${escapeAttribute(id)}">
    <span>${escapeHtml(label)}</span>
    ${page ? `<small>${escapeHtml(app.t('rulebook.labels.page', { page }))}</small>` : ''}
  </button>`;
}

function summaryCard(label, value) {
  return `<article class="cp-card rulebook-summary-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function emptyState(app) {
  return `<div class="rulebook-empty"><strong>${escapeHtml(app.t('rulebook.empty.title'))}</strong><p>${escapeHtml(app.t('rulebook.empty.description'))}</p></div>`;
}

function getOptionalService(app, serviceId) {
  try { return app?.services?.get?.(serviceId) || null; } catch { return null; }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function escapeAttribute(value) { return escapeHtml(value); }
