import { CpLoader } from '../../../../core/ui/components/CpLoader.js';

export function mountGdprPage({ root, vm, app }) {
  vm = vm || app.services.get('gdpr.vm');
  let unsubscribe;
  const selection = {
    individualEvents: new Set(),
    teamEvents: new Set(),
    includeStartList: false,
    includeMedalList: false,
    includeMedalStanding: true,
    includeStats: false
  };

  function render() {
    root.innerHTML = buildHtml(vm.state, app, selection);
  }

  function readSelection() {
    return {
      individualEvents: [...selection.individualEvents],
      teamEvents: [...selection.teamEvents],
      includeStartList: selection.includeStartList,
      includeMedalList: selection.includeMedalList,
      includeMedalStanding: selection.includeMedalStanding,
      includeStats: selection.includeStats
    };
  }

  function hasSelection() {
    return selection.individualEvents.size > 0
      || selection.teamEvents.size > 0
      || selection.includeStartList
      || selection.includeMedalList
      || selection.includeMedalStanding
      || selection.includeStats;
  }

  async function handleClick(event) {
    const button = event.target.closest('[data-action]');
    const action = button?.dataset.action;
    if (!action) return;

    if (action === 'reload') {
      vm.load().catch(() => {});
      return;
    }

    if (action === 'preview' || action === 'publish') {
      if (!hasSelection()) {
        window.alert(app.t('gdpr.errors.noSelection'));
        return;
      }
      const payload = readSelection();
      try {
        if (action === 'preview') {
          await vm.preview(payload);
        } else {
          vm.clearPreview();
          await vm.publish(payload);
        }
      } catch (error) {
        // vm already stored the error in state -- render() below picks it up.
      }
      render();
      return;
    }

    if (action === 'closePreview') {
      vm.clearPreview();
      render();
    }
  }

  function handleChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (target.name === 'individualEvent') {
      if (target.checked) selection.individualEvents.add(target.value);
      else selection.individualEvents.delete(target.value);
    } else if (target.name === 'teamEvent') {
      if (target.checked) selection.teamEvents.add(target.value);
      else selection.teamEvents.delete(target.value);
    } else if (target.name in selection) {
      selection[target.name] = target.checked;
    }
  }

  unsubscribe = vm.state.__store ? vm.state.__store.subscribe(render) : null;
  root.addEventListener('click', handleClick);
  root.addEventListener('change', handleChange);
  render();
  vm.load().catch(() => {});

  return function unmount() {
    if (unsubscribe) unsubscribe();
    root.removeEventListener('click', handleClick);
    root.removeEventListener('change', handleChange);
  };
}

function buildHtml(state, app, selection) {
  if (state.isLoading) {
    return `<section class="ffta-page gdpr-page">${CpLoader({ label: app.t('gdpr.messages.loading') })}</section>`;
  }

  return `
    <section class="ffta-page gdpr-page">
      <header class="gdpr-header">
        <h1>${escapeHtml(app.t('gdpr.title'))}</h1>
        <p class="gdpr-intro">${escapeHtml(app.t('gdpr.intro'))}</p>
        <button type="button" class="cp-button" data-action="reload">${escapeHtml(app.t('gdpr.actions.reload'))}</button>
      </header>

      ${state.error ? `<div class="ffta-badge ffta-badge--error">${escapeHtml(state.error)}</div>` : ''}

      ${buildStatus(state, app)}
      ${buildEvents(state, app, selection)}
      ${buildOptions(app, selection)}

      <div class="ffta-actions ffta-mt-md">
        <button type="button" class="cp-button" data-action="preview">${escapeHtml(app.t('gdpr.actions.preview'))}</button>
        <button type="button" class="cp-button cp-button--primary" data-action="publish" ${state.credentialsConfigured ? '' : 'disabled'} ${state.isPublishing ? 'disabled' : ''}>
          ${escapeHtml(state.isPublishing ? app.t('gdpr.messages.publishing') : app.t('gdpr.actions.publish'))}
        </button>
      </div>

      ${buildPreview(state, app)}
      ${buildLastResult(state, app)}
    </section>
  `;
}

function buildStatus(state, app) {
  const optedOutMessage = state.optedOutCount > 0
    ? app.t('gdpr.status.optedOutSome').replace('{count}', String(state.optedOutCount))
    : app.t('gdpr.status.optedOutNone');
  const optedOutVariant = state.optedOutCount > 0 ? 'warning' : 'info';

  return `
    <div class="gdpr-status">
      <div class="ffta-badge ffta-badge--${optedOutVariant}">${escapeHtml(optedOutMessage)}</div>
      ${state.credentialsConfigured
        ? `<div class="ffta-badge ffta-badge--info">${escapeHtml(app.t('gdpr.status.credentialsConfigured'))}</div>`
        : `<div class="ffta-badge ffta-badge--error">${escapeHtml(app.t('gdpr.status.credentialsMissing'))}</div>`}
    </div>
  `;
}

function buildEvents(state, app, selection) {
  const individual = state.events?.individual ?? [];
  const team = state.events?.team ?? [];

  function buildList(events, name, selectedSet) {
    if (!events.length) {
      return `<p class="gdpr-events-empty">${escapeHtml(app.t('gdpr.events.empty'))}</p>`;
    }
    return `<ul class="gdpr-events-list">${events.map((eventItem) => `
      <li>
        <label>
          <input type="checkbox" name="${name}" value="${escapeAttribute(eventItem.code)}" ${selectedSet.has(eventItem.code) ? 'checked' : ''}>
          ${escapeHtml(eventItem.code)} - ${escapeHtml(eventItem.name)}
        </label>
      </li>
    `).join('')}</ul>`;
  }

  return `
    <div class="gdpr-events">
      <div class="gdpr-events-column">
        <h2>${escapeHtml(app.t('gdpr.events.individualTitle'))}</h2>
        ${buildList(individual, 'individualEvent', selection.individualEvents)}
      </div>
      <div class="gdpr-events-column">
        <h2>${escapeHtml(app.t('gdpr.events.teamTitle'))}</h2>
        ${buildList(team, 'teamEvent', selection.teamEvents)}
      </div>
    </div>
  `;
}

function buildOptions(app, selection) {
  const options = [
    ['includeStartList', 'gdpr.options.includeStartList'],
    ['includeMedalList', 'gdpr.options.includeMedalList'],
    ['includeMedalStanding', 'gdpr.options.includeMedalStanding'],
    ['includeStats', 'gdpr.options.includeStats']
  ];
  return `
    <div class="gdpr-options">
      <h2>${escapeHtml(app.t('gdpr.options.title'))}</h2>
      ${options.map(([key, labelKey]) => `
        <label class="gdpr-option">
          <input type="checkbox" name="${key}" ${selection[key] ? 'checked' : ''}>
          ${escapeHtml(app.t(labelKey))}
        </label>
      `).join('')}
    </div>
  `;
}

function buildPreview(state, app) {
  if (!state.preview) return '';
  return `
    <div class="gdpr-preview">
      <div class="gdpr-preview-header">
        <h2>${escapeHtml(app.t('gdpr.preview.title'))}</h2>
        <button type="button" class="cp-button" data-action="closePreview">${escapeHtml(app.t('gdpr.actions.closePreview'))}</button>
      </div>
      <p>${escapeHtml(app.t('gdpr.preview.optedOutCount').replace('{count}', String(state.preview.optedOutCount ?? 0)))}</p>
      <p class="gdpr-preview-hint">${escapeHtml(app.t('gdpr.preview.hint'))}</p>
      <pre class="gdpr-preview-payload">${escapeHtml(JSON.stringify(state.preview.payload, null, 2))}</pre>
    </div>
  `;
}

function buildLastResult(state, app) {
  if (!state.lastResult) return '';
  const responseError = Number(state.lastResult.response?.error ?? 0) !== 0;
  const message = responseError
    ? app.t('gdpr.result.failure')
    : app.t('gdpr.result.success').replace('{count}', String(state.lastResult.optedOutCount ?? 0));
  return `<div class="ffta-badge ffta-badge--${responseError ? 'error' : 'success'}">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
