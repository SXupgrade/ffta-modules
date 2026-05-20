/**
 * Minimal page mounted by the generic page resolver.
 * It receives the public app context and, when available, the ViewModel
 * registered in module.mount.js.
 *
 * @param {{ root: HTMLElement, vm?: Object, app: Object }} params
 * @returns {Function} unmount callback
 */
export function mountMinimalPage({ root, vm, app }) {
  const localVm = vm || app.services.get('minimal-module.vm');
  const unsubscribe = localVm.state.__store?.subscribe(render) ?? null;

  function render() {
    root.innerHTML = buildHtml({ state: localVm.state, app });
  }

  async function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    if (action === 'increment') {
      localVm.incrementCounter();
      return;
    }

    if (action === 'save-greeting') {
      const input = root.querySelector('[data-field="greeting"]');
      await localVm.saveGreeting(input?.value);
    }
  }

  root.addEventListener('click', handleClick);
  render();
  localVm.load().catch(() => {});

  return function unmountMinimalPage() {
    root.removeEventListener('click', handleClick);
    if (unsubscribe) unsubscribe();
  };
}

function buildHtml({ state, app }) {
  const tournamentName = state.tournament?.name || state.tournament?.code || app.t('minimal.tournament.none');

  return `
    <section class="ffta-page minimal-module">
      <div class="minimal-module__hero">
        <div>
          <p class="minimal-module__eyebrow">${escapeHtml(app.t('minimal.eyebrow'))}</p>
          <h1>${escapeHtml(app.t('minimal.title'))}</h1>
          <p>${escapeHtml(app.t('minimal.description'))}</p>
        </div>
        <span class="minimal-module__badge">MVVM</span>
      </div>

      ${state.error ? `<div class="ffta-badge ffta-badge--error">${escapeHtml(state.error)}</div>` : ''}

      <div class="minimal-module__grid">
        <article class="cp-card minimal-module__card">
          <h2>${escapeHtml(app.t('minimal.sections.quickStart.title'))}</h2>
          <ol>
            <li>${escapeHtml(app.t('minimal.sections.quickStart.step1'))}</li>
            <li>${escapeHtml(app.t('minimal.sections.quickStart.step2'))}</li>
            <li>${escapeHtml(app.t('minimal.sections.quickStart.step3'))}</li>
            <li>${escapeHtml(app.t('minimal.sections.quickStart.step4'))}</li>
          </ol>
        </article>

        <article class="cp-card minimal-module__card">
          <h2>${escapeHtml(app.t('minimal.sections.files.title'))}</h2>
          <ul class="minimal-module__file-list">
            <li><code>module.manifest.js</code> — ${escapeHtml(app.t('minimal.sections.files.manifest'))}</li>
            <li><code>module.mount.js</code> — ${escapeHtml(app.t('minimal.sections.files.mount'))}</li>
            <li><code>application/*.js</code> — ${escapeHtml(app.t('minimal.sections.files.application'))}</li>
            <li><code>ui/pages/*.js</code> — ${escapeHtml(app.t('minimal.sections.files.ui'))}</li>
            <li><code>i18n/*.json</code> — ${escapeHtml(app.t('minimal.sections.files.i18n'))}</li>
          </ul>
        </article>

        <article class="cp-card minimal-module__card">
          <h2>${escapeHtml(app.t('minimal.sections.api.title'))}</h2>
          <div class="minimal-module__chips">
            <code>app.t()</code>
            <code>app.settings.get()</code>
            <code>app.settings.set()</code>
            <code>app.menu.register()</code>
            <code>app.routes.register()</code>
            <code>app.notify.success()</code>
          </div>
        </article>

        <article class="cp-card minimal-module__card">
          <h2>${escapeHtml(app.t('minimal.sections.demo.title'))}</h2>
          <label class="minimal-module__field">
            <span>${escapeHtml(app.t('minimal.fields.greeting'))}</span>
            <input type="text" data-field="greeting" value="${escapeAttribute(state.greeting)}">
          </label>
          <div class="minimal-module__actions">
            <button type="button" class="cp-button cp-button--primary" data-action="save-greeting">${escapeHtml(app.t('minimal.actions.saveGreeting'))}</button>
            <button type="button" class="cp-button" data-action="increment">${escapeHtml(app.t('minimal.actions.increment'))}</button>
          </div>
          <p class="ffta-muted">${escapeHtml(app.t('minimal.demo.clickCount'))}: ${Number(state.clickCount || 0)}</p>
          <p class="ffta-muted">${escapeHtml(app.t('minimal.tournament.current'))}: ${escapeHtml(tournamentName)}</p>
        </article>
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
