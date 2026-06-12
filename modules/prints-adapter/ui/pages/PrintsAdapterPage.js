export function mountPrintsAdapterPage({ root, vm, app }) {
  if (!vm) {
    root.innerHTML = `<div class="ffta-page"><div class="cp-alert cp-alert--danger">Module unavailable.</div></div>`;
    return () => {};
  }

  let unsubscribe = null;

  function render() {
    const state = vm.state;
    root.innerHTML = buildHtml(state, app);
  }

  function handleClick(event) {
    const sectionToggle = event.target.closest('[data-toggle-section]');
    if (sectionToggle) {
      vm.toggleSection(sectionToggle.dataset.toggleSection);
      return;
    }

    const printButton = event.target.closest('[data-print-id]');
    if (printButton) {
      const printout = findPrintout(vm.state.data, printButton.dataset.printId);
      if (printout) vm.openPrintout(printout);
      return;
    }

    const scorecardMode = event.target.closest('[data-scorecard-mode]')?.dataset.scorecardMode;
    if (scorecardMode) {
      const section = (vm.state.data?.sections || []).find((item) => item.id === 'scorecards');
      const modes = {
        standard: { draw: 'Complete', barcode: true, filled: false, personalScore: false },
        blank: { draw: 'Draw', barcode: false, filled: false, personalScore: false },
        filled: { draw: 'CompleteTotals', barcode: false, filled: true, personalScore: true }
      };
      vm.submitScorecards(section, modes[scorecardMode]);
    }
  }

  function handleInput(event) {
    const field = event.target.closest('[data-scorecard-field]')?.dataset.scorecardField;
    if (!field) return;
    if (field === 'distances') {
      const distances = [...root.querySelectorAll('[data-scorecard-field="distances"]:checked')].map((input) => input.value);
      vm.updateScorecardForm({ distances });
      return;
    }
    if (event.target.type === 'checkbox') {
      vm.updateScorecardForm({ [field]: event.target.checked });
      return;
    }
    vm.updateScorecardForm({ [field]: event.target.value });
  }

  root.addEventListener('click', handleClick);
  root.addEventListener('input', handleInput);
  root.addEventListener('change', handleInput);
  unsubscribe = vm.state.__store.subscribe(render);
  vm.load();

  return function unmount() {
    if (unsubscribe) unsubscribe();
    root.removeEventListener('click', handleClick);
    root.removeEventListener('input', handleInput);
    root.removeEventListener('change', handleInput);
  };
}

function buildHtml(state, app) {
  const data = state.data;
  return `
    <section class="ffta-page prints-adapter-page">
      <div class="ffta-page__header prints-adapter-hero">
        <div>
          <h1>${escapeHtml(app.t('printsAdapter.title'))}</h1>
          <p class="ffta-muted">${escapeHtml(app.t('printsAdapter.description'))}</p>
        </div>
      </div>

      ${state.isLoading ? `<div class="cp-card">${escapeHtml(app.t('printsAdapter.loading'))}</div>` : ''}
      ${state.error ? `<div class="cp-alert cp-alert--danger">${escapeHtml(state.error)}</div>` : ''}

      ${data ? `<div class="prints-adapter-grid">${(data.sections || []).map((section) => buildSection(section, state, app)).join('')}</div>` : ''}
    </section>
  `;
}

function buildSection(section, state, app) {
  const collapsed = state.collapsedSections?.has(section.id);
  const body = section.type === 'scorecards'
    ? buildScorecards(section, state.scorecardForm, app)
    : `<div class="prints-adapter-actions">${(section.items || []).map((item) => buildPrintButton(item, app)).join('')}</div>`;

  return `
    <article class="cp-card prints-adapter-card">
      <button type="button" class="prints-adapter-card__header" data-toggle-section="${escapeAttribute(section.id)}">
        <span>${escapeHtml(section.label)}</span>
        <span>${collapsed ? '+' : '−'}</span>
      </button>
      ${collapsed ? '' : `<div class="prints-adapter-card__body">${body}</div>`}
    </article>
  `;
}

function buildPrintButton(item, app) {
  return `
    <button type="button" class="cp-button prints-adapter-print" data-print-id="${escapeAttribute(item.id)}">
      <span aria-hidden="true">📄</span>
      <span>${escapeHtml(item.label)}</span>
    </button>
  `;
}

function buildScorecards(section, form, app) {
  const sessions = section.sessions || [];
  const distances = Array.from({ length: Math.max(1, Number(section.numDistances || 1)) }, (_, index) => String(index + 1));
  return `
    <p class="ffta-muted ffta-small">${escapeHtml(app.t('printsAdapter.scorecards.help'))}</p>
    <div class="prints-adapter-scorecards">
      <label>${escapeHtml(app.t('printsAdapter.scorecards.session'))}
        <select data-scorecard-field="session">
          <option value="">${escapeHtml(app.t('printsAdapter.scorecards.allSessions'))}</option>
          ${sessions.map((session) => `<option value="${escapeAttribute(session.order)}" ${String(form.session) === String(session.order) ? 'selected' : ''}>${escapeHtml(session.label)}</option>`).join('')}
        </select>
      </label>
      <label>${escapeHtml(app.t('printsAdapter.scorecards.targetsFrom'))}
        <input type="number" min="1" data-scorecard-field="from" value="${escapeAttribute(form.from)}">
      </label>
      <label>${escapeHtml(app.t('printsAdapter.scorecards.targetsTo'))}
        <input type="number" min="1" data-scorecard-field="to" value="${escapeAttribute(form.to)}">
      </label>
      <div class="prints-adapter-distances">
        <span>${escapeHtml(app.t('printsAdapter.scorecards.distances'))}</span>
        ${distances.map((distance) => `<label><input type="checkbox" value="${distance}" data-scorecard-field="distances" ${(form.distances || []).includes(distance) ? 'checked' : ''}> D${distance}</label>`).join('')}
      </div>
      <label class="prints-adapter-check"><input type="checkbox" data-scorecard-field="noEmpty" ${form.noEmpty ? 'checked' : ''}> ${escapeHtml(app.t('printsAdapter.scorecards.noEmpty'))}</label>
      <div class="prints-adapter-actions">
        <button type="button" class="cp-button cp-button--primary" data-scorecard-mode="standard">📄 ${escapeHtml(app.t('printsAdapter.actions.scorecard'))}</button>
        <button type="button" class="cp-button" data-scorecard-mode="blank">📄 ${escapeHtml(app.t('printsAdapter.actions.blankScorecard'))}</button>
        <button type="button" class="cp-button" data-scorecard-mode="filled">📄 ${escapeHtml(app.t('printsAdapter.actions.filledScorecard'))}</button>
      </div>
    </div>
  `;
}

function findPrintout(data, printId) {
  for (const section of data?.sections || []) {
    const match = (section.items || []).find((item) => item.id === printId);
    if (match) return match;
  }
  return null;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
