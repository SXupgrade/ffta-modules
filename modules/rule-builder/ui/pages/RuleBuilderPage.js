import { CpLoader } from '../../../../core/ui/components/CpLoader.js';

export function mountRuleBuilderPage({ root, vm, app }) {
  vm = vm || app.services.get('rule-builder.vm');
  const unsubscribe = vm.state.__store ? vm.state.__store.subscribe(render) : null;

  function render() { root.innerHTML = buildHtml(vm.state, app); }

  function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'reload') vm.load().catch(() => {});
    if (action === 'download') vm.download();
  }

  root.addEventListener('click', handleClick);
  render();
  vm.load().catch(() => {});

  return function unmount() {
    if (unsubscribe) unsubscribe();
    root.removeEventListener('click', handleClick);
  };
}

function buildHtml(state, app) {
  return `
    <section class="ffta-page rule-builder-page">
      <div class="rule-builder-hero">
        <div>
          <p class="rule-builder-eyebrow">Compet+</p>
          <h1>${escapeHtml(app.t('ruleBuilder.title'))}</h1>
          <p>${escapeHtml(app.t('ruleBuilder.intro'))}</p>
        </div>
      </div>

      ${state.error ? `<div class="ffta-badge ffta-badge--error">${escapeHtml(state.error)}</div>` : ''}

      ${state.isLoading ? CpLoader({ label: app.t('ruleBuilder.messages.loading') }) : buildCard(state, app)}
    </section>
  `;
}

function buildCard(state, app) {
  const status = state.status;
  return `
    <article class="cp-card rule-builder-card">
      <h2>${escapeHtml(app.t('ruleBuilder.card.title'))}</h2>
      ${status ? `
        <dl class="rule-builder-summary">
          <dt>${escapeHtml(app.t('ruleBuilder.summary.name'))}</dt>
          <dd>${escapeHtml(status.name)}</dd>
          <dt>${escapeHtml(app.t('ruleBuilder.summary.type'))}</dt>
          <dd>${escapeHtml(status.typeName)}${status.typeSubRule ? ` — ${escapeHtml(status.typeSubRule)}` : ''}</dd>
          <dt>${escapeHtml(app.t('ruleBuilder.summary.dates'))}</dt>
          <dd>${escapeHtml(status.whenFrom)} → ${escapeHtml(status.whenTo)}</dd>
        </dl>
      ` : ''}
      <p class="rule-builder-hint">${escapeHtml(app.t('ruleBuilder.card.hint'))}</p>
      <div class="ffta-actions">
        <button type="button" class="cp-button" data-action="reload" ${state.isLoading ? 'disabled' : ''}>${escapeHtml(app.t('ruleBuilder.actions.reload'))}</button>
        <button type="button" class="cp-button cp-button--primary" data-action="download" ${state.isDownloading ? 'disabled' : ''}>
          ${escapeHtml(state.isDownloading ? app.t('ruleBuilder.actions.downloading') : app.t('ruleBuilder.actions.download'))}
        </button>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
