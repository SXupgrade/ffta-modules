import { wikiSections } from '../../content/wikiContent.js';

export function mountDeveloperWikiPage({ root, app }) {
  let activeSectionId = wikiSections[0]?.id || 'overview';
  let query = '';

  function t(key) {
    return app.t(key);
  }

  function getFilteredSections() {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return wikiSections;
    return wikiSections.filter((section) => {
      const haystack = [
        section.title,
        ...(section.body || []),
        ...(section.steps || []),
        ...(section.checklist || []),
        section.code || ''
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }

  function render() {
    const filteredSections = getFilteredSections();
    if (!filteredSections.some((section) => section.id === activeSectionId)) {
      activeSectionId = filteredSections[0]?.id || wikiSections[0]?.id;
    }
    const activeSection = wikiSections.find((section) => section.id === activeSectionId) || filteredSections[0] || wikiSections[0];

    root.innerHTML = `
      <section class="ffta-page developer-wiki-page">
        <div class="ffta-page__header developer-wiki-hero">
          <div>
            <span class="developer-wiki-kicker">SDK / Lab</span>
            <h1>${escapeHtml(t('developer-wiki.page.title'))}</h1>
            <p class="ffta-muted">${escapeHtml(t('developer-wiki.page.description'))}</p>
          </div>
          <div class="developer-wiki-callout">${escapeHtml(t('developer-wiki.page.labFirst'))}</div>
        </div>

        <div class="developer-wiki-layout">
          <aside class="developer-wiki-sidebar">
            <input class="developer-wiki-search" data-action="search" value="${escapeAttribute(query)}" placeholder="${escapeAttribute(t('developer-wiki.page.searchPlaceholder'))}">
            <nav class="developer-wiki-nav" aria-label="Developer wiki sections">
              ${filteredSections.map((section) => buildNavItem(section)).join('') || buildEmptySearch(app)}
            </nav>
          </aside>

          <article class="developer-wiki-content">
            ${activeSection ? buildSection(activeSection, app) : buildEmptySearch(app)}
          </article>
        </div>
      </section>
    `;
  }

  function buildNavItem(section) {
    const isActive = section.id === activeSectionId;
    return `<button type="button" class="developer-wiki-nav__item ${isActive ? 'is-active' : ''}" data-section-id="${escapeAttribute(section.id)}">
      <span>${escapeHtml(app.t(section.titleKey) || section.title)}</span>
      <small>${escapeHtml(section.level || '')}</small>
    </button>`;
  }

  function buildSection(section, app) {
    return `
      <header class="developer-wiki-section-header">
        <span class="ffta-badge">${escapeHtml(section.level || 'guide')}</span>
        <h2>${escapeHtml(app.t(section.titleKey) || section.title)}</h2>
      </header>
      ${(section.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      ${section.steps ? buildOrderedList(section.steps) : ''}
      ${section.checklist ? buildChecklist(section.checklist) : ''}
      ${section.code ? buildCodeBlock(section.code, app) : ''}
    `;
  }

  function buildOrderedList(items) {
    return `<ol class="developer-wiki-steps">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`;
  }

  function buildChecklist(items) {
    return `<ul class="developer-wiki-checklist">${items.map((item) => `<li><span aria-hidden="true">✓</span>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }

  function buildCodeBlock(code, app) {
    return `<div class="developer-wiki-code-card">
      <button type="button" class="cp-button" data-action="copy-code" data-code="${escapeAttribute(code)}">${escapeHtml(app.t('developer-wiki.page.copy'))}</button>
      <pre><code>${escapeHtml(code)}</code></pre>
    </div>`;
  }

  function buildEmptySearch(app) {
    return `<p class="ffta-muted">${escapeHtml(app.t('app.emptyState.noResult') || 'No result.')}</p>`;
  }

  function handleClick(event) {
    const sectionButton = event.target.closest('[data-section-id]');
    if (sectionButton) {
      activeSectionId = sectionButton.dataset.sectionId;
      render();
      return;
    }

    const copyButton = event.target.closest('[data-action="copy-code"]');
    if (copyButton) {
      const code = copyButton.dataset.code || '';
      navigator.clipboard?.writeText(code).then(() => {
        app.notify.success(t('developer-wiki.page.copied'));
      }).catch(() => {
        app.notify.error('Unable to copy code.');
      });
    }
  }

  function handleInput(event) {
    if (event.target.matches('[data-action="search"]')) {
      query = event.target.value;
      render();
    }
  }

  root.addEventListener('click', handleClick);
  root.addEventListener('input', handleInput);
  render();

  return function unmountDeveloperWikiPage() {
    root.removeEventListener('click', handleClick);
    root.removeEventListener('input', handleInput);
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
