export function mountPlanFinalesPage({ root, app }) {
  const moduleInfo = app.services.get('plan-finales.legacy');
  root.innerHTML = buildLegacyPage({ app, moduleInfo });

  function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'openLegacy') {
      window.open(moduleInfo.url, '_blank', 'noopener');
    }
  }

  root.addEventListener('click', handleClick);
  return () => root.removeEventListener('click', handleClick);
}

function buildLegacyPage({ app, moduleInfo }) {
  const title = app.t('plan-finales.title');
  const description = app.t('plan-finales.description');
  const openLabel = app.t('app.actions.open');
  const iframeTitle = escapeHtml(title);
  return `
    <section class="ffta-page legacy-module-page legacy-module-page--plan-finales">
      <div class="legacy-module-page__header">
        <div>
          <p class="ffta-kicker">FFTA</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="ffta-muted">${escapeHtml(description)}</p>
        </div>
        <button type="button" class="cp-button cp-button--secondary" data-action="openLegacy">${escapeHtml(openLabel)}</button>
      </div>
      <div class="legacy-module-page__frame-card">
        <iframe class="legacy-module-page__frame" src="${escapeAttribute(moduleInfo.url)}" title="${iframeTitle}"></iframe>
      </div>
    </section>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}
