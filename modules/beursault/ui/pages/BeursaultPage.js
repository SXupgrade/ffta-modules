export function mountBeursaultPage({ root, vm, app }) {
  let state = null;
  const unsubscribe = vm.subscribe((nextState) => {
    state = nextState;
    render();
  });

  // UX v0.2.14 : chargement automatique — l'utilisateur n'a plus a cliquer
  // « Charger » : les lignes arrivent a l'ouverture et a chaque changement de filtre.
  Promise.resolve(vm.initialize()).then(() => vm.loadRows()).catch(() => {});

  function render() {
    if (!state) return;
    const focused = captureFocus();
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
          <button type="button" class="cp-btn cp-btn--secondary" data-action="load" ${state.loading || !isEligible ? 'disabled' : ''}>${escapeHtml(app.t('beursault.actions.load'))}</button>
        </article>
        <article class="cp-card beursault-table-card">
          ${state.rows.length ? renderTable() : `<p class="ffta-muted">${escapeHtml(app.t('beursault.empty'))}</p>`}
        </article>
      </section>
    `;
    restoreFocus(focused);
  }

  function captureFocus() {
    const el = document.activeElement;
    if (!el || !root.contains(el)) return null;
    const rowId = el.dataset?.rowId;
    const scoreField = el.dataset?.scoreField;
    const filter = el.dataset?.filter;
    if (!rowId && !filter) return null;
    return {
      rowId,
      scoreField,
      filter,
      selectionStart: typeof el.selectionStart === 'number' ? el.selectionStart : null
    };
  }

  function restoreFocus(focused) {
    if (!focused) return;
    let el = null;
    if (focused.filter) {
      el = root.querySelector(`[data-filter="${focused.filter}"]`);
    } else if (focused.rowId && focused.scoreField) {
      el = root.querySelector(`[data-row-id="${CSS.escape(String(focused.rowId))}"][data-score-field="${focused.scoreField}"]`);
    }
    if (!el) return;
    el.focus();
    if (focused.selectionStart !== null && typeof el.setSelectionRange === 'function') {
      try { el.setSelectionRange(focused.selectionStart, focused.selectionStart); } catch { /* type number */ }
    }
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
        <td><span class="ffta-badge ${score.valid ? 'ffta-badge--success' : 'ffta-badge--error'}" ${score.valid ? '' : `title="${escapeAttribute(app.t('beursault.status.invalidHelp'))}"`}>${escapeHtml(app.t(score.valid ? 'beursault.status.valid' : 'beursault.status.invalid'))}</span></td>
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
      // UX v0.2.14 : rechargement automatique au changement de filtre
      // (uniquement sur l'evenement change, pour ne pas recharger a chaque touche).
      if (event.type === 'change') vm.loadRows();
      return;
    }

    const scoreField = event.target.closest('[data-score-field]');
    if (scoreField) {
      vm.updateRow(scoreField.dataset.rowId, scoreField.dataset.scoreField, scoreField.value);
    }
  }

  // UX v0.2.14 : Entree = case de score suivante, comme dans un tableur.
  function handleKeydown(event) {
    if (event.key !== 'Enter') return;
    const current = event.target.closest('[data-score-field]');
    if (!current) return;
    event.preventDefault();
    const inputs = [...root.querySelectorAll('input[data-score-field]')];
    const index = inputs.indexOf(current);
    const next = inputs[index + 1];
    if (next) {
      next.focus();
      next.select?.();
    }
  }

  function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'load') vm.loadRows();
    if (action === 'save') vm.saveRow(event.target.closest('[data-row-id]')?.dataset.rowId);
  }

  root.addEventListener('input', handleInput);
  root.addEventListener('keydown', handleKeydown);
  root.addEventListener('change', handleInput);
  root.addEventListener('click', handleClick);

  return function unmountBeursaultPage() {
    unsubscribe();
    root.removeEventListener('input', handleInput);
    root.removeEventListener('keydown', handleKeydown);
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
