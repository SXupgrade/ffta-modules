export function mountBeursaultPage({ root, vm, app }) {
  let state = null;
  const unsubscribe = vm.subscribe((nextState) => {
    state = nextState;
    render();
  });

  vm.initialize();

  function render() {
    if (!state) return;
    const isEligible = !state.context || state.context.locSubRule === 'SetFrBeursault';
    root.innerHTML = `
      <section class="ffta-page beursault-page">
        <div class="ffta-page__header">
          <div>
            <h1>${escapeHtml(app.t('beursault.page.title'))}</h1>
            <p class="ffta-muted">${escapeHtml(app.t('beursault.page.description'))}</p>
          </div>
        </div>
        ${!isEligible ? `<p class="ffta-badge ffta-badge--error">${escapeHtml(app.t('beursault.warning.notBeursault'))}</p>` : ''}
        ${state.error ? `<p class="ffta-badge ffta-badge--error">${escapeHtml(state.error)}</p>` : ''}
        <article class="cp-card beursault-filters">
          <label>${escapeHtml(app.t('beursault.filters.session'))}
            <select data-filter="session">
              ${state.sessions.map((session) => `<option value="${escapeAttribute(session.id)}" ${String(state.filters.session) === String(session.id) ? 'selected' : ''}>${escapeHtml(session.label)}</option>`).join('')}
            </select>
          </label>
          <label>${escapeHtml(app.t('beursault.filters.fromTarget'))}
            <input type="number" min="1" data-filter="fromTarget" value="${escapeAttribute(state.filters.fromTarget)}">
          </label>
          <label>${escapeHtml(app.t('beursault.filters.toTarget'))}
            <input type="number" min="1" data-filter="toTarget" value="${escapeAttribute(state.filters.toTarget)}">
          </label>
          <button type="button" class="cp-button cp-button--primary" data-action="load" ${state.loading || !isEligible ? 'disabled' : ''}>${escapeHtml(app.t('beursault.actions.load'))}</button>
        </article>
        <article class="cp-card beursault-table-card">
          ${state.rows.length ? renderTable() : `<p class="ffta-muted">${escapeHtml(app.t('beursault.empty'))}</p>`}
        </article>
      </section>
    `;
  }

  function renderTable() {
    return `
      <div class="beursault-table-wrap">
        <table class="beursault-table">
          <thead>
            <tr>
              <th>${escapeHtml(app.t('beursault.table.status'))}</th>
              <th>${escapeHtml(app.t('beursault.table.target'))}</th>
              <th>${escapeHtml(app.t('beursault.table.license'))}</th>
              <th>${escapeHtml(app.t('beursault.table.archer'))}</th>
              <th>${escapeHtml(app.t('beursault.table.club'))}</th>
              <th>${escapeHtml(app.t('beursault.table.ones'))}</th>
              <th>${escapeHtml(app.t('beursault.table.twos'))}</th>
              <th>${escapeHtml(app.t('beursault.table.threes'))}</th>
              <th>${escapeHtml(app.t('beursault.table.fours'))}</th>
              <th>${escapeHtml(app.t('beursault.table.honours'))}</th>
              <th>${escapeHtml(app.t('beursault.table.points'))}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${state.rows.map(renderRow).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRow(row) {
    const saving = state.savingIds.has(String(row.id));
    const score = row.score || {};
    return `
      <tr class="${score.valid ? '' : 'is-invalid'}">
        <td><span class="ffta-badge ${score.valid ? '' : 'ffta-badge--error'}">${escapeHtml(app.t(score.valid ? 'beursault.status.valid' : 'beursault.status.invalid'))}</span></td>
        <td>${escapeHtml(row.target)}</td>
        <td>${escapeHtml(row.license)}</td>
        <td>${escapeHtml(row.firstName)} ${escapeHtml(row.lastName)} <span class="ffta-muted">${escapeHtml(row.category)}</span></td>
        <td>${escapeHtml(row.clubCode)}</td>
        ${scoreInput(row, 'ones')}
        ${scoreInput(row, 'twos')}
        ${scoreInput(row, 'threes')}
        ${scoreInput(row, 'fours')}
        <td><strong>${escapeHtml(score.honours)}</strong></td>
        <td><strong>${escapeHtml(score.points)}</strong></td>
        <td><button type="button" class="cp-button" data-action="save" data-row-id="${escapeAttribute(row.id)}" ${saving || !score.valid ? 'disabled' : ''}>${escapeHtml(app.t(saving ? 'beursault.actions.saving' : 'beursault.actions.save'))}</button></td>
      </tr>
    `;
  }

  function scoreInput(row, field) {
    return `<td><input class="beursault-score-input" type="number" min="0" max="40" data-row-id="${escapeAttribute(row.id)}" data-score-field="${escapeAttribute(field)}" value="${escapeAttribute(row.score?.[field] ?? '')}"></td>`;
  }

  function handleInput(event) {
    const filter = event.target.closest('[data-filter]');
    if (filter) {
      vm.setFilter(filter.dataset.filter, filter.value);
      return;
    }

    const scoreField = event.target.closest('[data-score-field]');
    if (scoreField) {
      vm.updateRow(scoreField.dataset.rowId, scoreField.dataset.scoreField, scoreField.value);
    }
  }

  function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'load') vm.loadRows();
    if (action === 'save') vm.saveRow(event.target.closest('[data-row-id]')?.dataset.rowId);
  }

  root.addEventListener('input', handleInput);
  root.addEventListener('change', handleInput);
  root.addEventListener('click', handleClick);

  return function unmountBeursaultPage() {
    unsubscribe();
    root.removeEventListener('input', handleInput);
    root.removeEventListener('change', handleInput);
    root.removeEventListener('click', handleClick);
  };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}
