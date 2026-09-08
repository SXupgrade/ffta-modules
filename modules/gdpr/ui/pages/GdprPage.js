import { CpLoader } from '../../../../core/ui/components/CpLoader.js';

// Custom, anonymized-print PHP endpoints this tab links to -- deployed
// under Modules/Custom/ffta-modules/modules/gdpr/print/ (this repo's own
// root maps 1:1 onto Modules/Custom/ffta-modules/, see README/AGENTS.md),
// resolved via app.ianseo.resolveUrl() the same way prints-adapter resolves
// Ianseo's own native print scripts.
const PRINT_DOCUMENTS = [
  { id: 'participants', path: 'Modules/Custom/ffta-modules/modules/gdpr/print/PrintParticipantsAnonymized.php', labelKey: 'gdpr.prints.participants' },
  { id: 'qualification', path: 'Modules/Custom/ffta-modules/modules/gdpr/print/PrintQualificationAnonymized.php', labelKey: 'gdpr.prints.qualification' }
];

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

    if (action === 'tab') {
      vm.setTab(button.dataset.tab || 'participants');
      return;
    }

    if (action === 'reload') {
      vm.load().catch(() => {});
      return;
    }

    if (action === 'openPrint') {
      const doc = PRINT_DOCUMENTS.find((entry) => entry.id === button.dataset.printId);
      if (doc) window.open(app.ianseo.resolveUrl(doc.path), 'PrintOut');
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
      return;
    }
    if (target.name === 'teamEvent') {
      if (target.checked) selection.teamEvents.add(target.value);
      else selection.teamEvents.delete(target.value);
      return;
    }
    if (target.name in selection) {
      selection[target.name] = target.checked;
      return;
    }
    if (target.dataset.role === 'participant-optout') {
      const entryId = Number(target.dataset.entryId || 0);
      if (!entryId) return;
      vm.setParticipantOptOut(entryId, target.checked).catch(() => {
        render();
      });
    }
  }

  unsubscribe = vm.state.__store ? vm.state.__store.subscribe(render) : null;
  root.addEventListener('click', handleClick);
  root.addEventListener('change', handleChange);
  render();
  // Only the active tab's own data is fetched -- see vm.setTab()'s lazy
  // per-tab loading. Participants is the default tab, so load it now.
  vm.loadParticipants().catch(() => {});

  return function unmount() {
    if (unsubscribe) unsubscribe();
    root.removeEventListener('click', handleClick);
    root.removeEventListener('change', handleChange);
  };
}

function buildHtml(state, app, selection) {
  const active = state.activeTab || 'participants';
  return `
    <section class="ffta-page gdpr-page">
      <header class="gdpr-header">
        <h1>${escapeHtml(app.t('gdpr.title'))}</h1>
        <p class="gdpr-intro">${escapeHtml(app.t('gdpr.intro'))}</p>
      </header>

      <div class="gdpr-tabs">
        ${tabButton(app, active, 'participants', app.t('gdpr.tabs.participants'))}
        ${tabButton(app, active, 'prints', app.t('gdpr.tabs.prints'))}
        ${tabButton(app, active, 'publish', app.t('gdpr.tabs.publish'))}
      </div>

      ${state.error ? `<div class="ffta-badge ffta-badge--error">${escapeHtml(state.error)}</div>` : ''}

      ${active === 'participants' ? buildParticipantsTab(state, app) : ''}
      ${active === 'prints' ? buildPrintsTab(state, app) : ''}
      ${active === 'publish' ? buildPublishTab(state, app, selection) : ''}
    </section>
  `;
}

function tabButton(app, active, id, label) {
  return `<button type="button" class="gdpr-tab ${active === id ? 'is-active' : ''}" data-action="tab" data-tab="${escapeAttribute(id)}">${escapeHtml(label)}</button>`;
}

// ── Tab 1: Liste des participants ────────────────────────────────────────
function buildParticipantsTab(state, app) {
  if (state.isLoadingParticipants) {
    return CpLoader({ label: app.t('gdpr.messages.loading') });
  }
  const participants = state.participants || [];
  const savingIds = new Set(state.savingParticipantIds || []);
  return `
    <div class="gdpr-participants">
      <p class="gdpr-participants-intro">${escapeHtml(app.t('gdpr.participants.intro'))}</p>
      ${participants.length ? `
        <table class="gdpr-participants-table">
          <thead>
            <tr>
              <th>${escapeHtml(app.t('gdpr.participants.columns.name'))}</th>
              <th>${escapeHtml(app.t('gdpr.participants.columns.club'))}</th>
              <th>${escapeHtml(app.t('gdpr.participants.columns.category'))}</th>
              <th>${escapeHtml(app.t('gdpr.participants.columns.optOut'))}</th>
            </tr>
          </thead>
          <tbody>
            ${participants.map((participant) => `
              <tr>
                <td>${escapeHtml(`${participant.lastName} ${participant.firstName}`.trim())}</td>
                <td>${escapeHtml(participant.clubName || participant.clubCode || '')}</td>
                <td>${escapeHtml([participant.division, participant.class].filter(Boolean).join(' '))}</td>
                <td>
                  <label class="gdpr-participant-optout">
                    <input type="checkbox" data-role="participant-optout" data-entry-id="${participant.entryId}" ${participant.optedOut ? 'checked' : ''} ${savingIds.has(participant.entryId) ? 'disabled' : ''}>
                    ${escapeHtml(app.t('gdpr.participants.optOutLabel'))}
                  </label>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<p class="gdpr-events-empty">${escapeHtml(app.t('gdpr.participants.empty'))}</p>`}
    </div>
  `;
}

// ── Tab 2: Impressions ───────────────────────────────────────────────────
function buildPrintsTab(state, app) {
  return `
    <div class="gdpr-prints">
      <p class="gdpr-prints-intro">${escapeHtml(app.t('gdpr.prints.intro'))}</p>
      <ul class="gdpr-prints-list">
        ${PRINT_DOCUMENTS.map((doc) => `
          <li>
            <button type="button" class="cp-button" data-action="openPrint" data-print-id="${escapeAttribute(doc.id)}">
              ${escapeHtml(app.t(doc.labelKey))}
            </button>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

// ── Tab 3: Publication internet (previously this page's only content) ───
function buildPublishTab(state, app, selection) {
  if (state.isLoading) {
    return CpLoader({ label: app.t('gdpr.messages.loading') });
  }
  return `
    <div class="gdpr-publish">
      <div class="gdpr-publish-header">
        <button type="button" class="cp-button" data-action="reload">${escapeHtml(app.t('gdpr.actions.reload'))}</button>
      </div>

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
    </div>
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
        : `<div class="ffta-badge ffta-badge--warning">${escapeHtml(app.t('gdpr.status.testMode'))}</div>`}
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
