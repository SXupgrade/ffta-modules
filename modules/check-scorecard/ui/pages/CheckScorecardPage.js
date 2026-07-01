export function mountCheckScorecardPage({ root, vm, app }) {
  let state = null;
  const unsubscribe = vm.subscribe((nextState) => {
    state = nextState;
    render();
  });

  Promise.resolve(vm.initialize()).catch(() => {});

  function render() {
    if (!state) return;
    const focused = captureFocus();
    const access = app.acl?.getCachedAccess?.('check-scorecard') || 'read';
    const canWrite = access === 'write';
    root.innerHTML = `
      <section class="ffta-page check-scorecard-page">
        <div class="ffta-page__header check-scorecard-header">
          <div>
            <h1>${escapeHtml(app.t('check-scorecard.page.title'))}</h1>
            <p class="ffta-muted">${escapeHtml(app.t('check-scorecard.page.description'))}</p>
          </div>
          ${state.context ? `<span class="ffta-badge">${escapeHtml(app.t('check-scorecard.badge.distances', { count: state.context.numDistances }))}</span>` : ''}
        </div>
        ${!canWrite ? `<p class="ffta-badge">${escapeHtml(app.t('check-scorecard.warning.readOnly'))}</p>` : ''}
        ${state.error ? `<p class="ffta-badge ffta-badge--error">${escapeHtml(state.error)}</p>` : ''}
        <article class="cp-card check-scorecard-toolbar">
          <label class="check-scorecard-session-picker">${escapeHtml(app.t('check-scorecard.filters.session'))}
            <select data-filter="session" ${state.loading ? 'disabled' : ''}>
              ${state.sessions.map((session) => `<option value="${escapeAttribute(session.id)}" ${String(state.filters.session) === String(session.id) ? 'selected' : ''}>${escapeHtml(session.label)}</option>`).join('')}
            </select>
          </label>
          ${state.context ? renderSummary() : ''}
          <button type="button" class="cp-button cp-button--secondary check-scorecard-refresh" data-action="load" ${state.loading ? 'disabled' : ''}>${escapeHtml(app.t(state.loading ? 'check-scorecard.actions.loading' : 'check-scorecard.actions.load'))}</button>
        </article>
        ${state.context ? renderHelp() : ''}
        <article class="cp-card check-scorecard-table-card">
          ${state.rows.length ? renderTable(canWrite) : `<p class="ffta-muted check-scorecard-empty">${escapeHtml(app.t('check-scorecard.empty'))}</p>`}
        </article>
      </section>
    `;
    restoreFocus(focused);
  }

  function renderSummary() {
    const rows = state.rows || [];
    const fullMask = Number(state.context.fullConfirmMask || 0);
    const globalCount = rows.filter((row) => row.globalConfirmed).length;
    const fullCount = rows.filter((row) => (Number(row.quConfirm) & fullMask) === fullMask).length;
    return `
      <div class="check-scorecard-kpis" aria-label="${escapeAttribute(app.t('check-scorecard.summary.title'))}">
        <div class="check-scorecard-kpi">
          <span>${escapeHtml(app.t('check-scorecard.summary.archers'))}</span>
          <strong>${escapeHtml(rows.length)}</strong>
        </div>
        <div class="check-scorecard-kpi">
          <span>${escapeHtml(app.t('check-scorecard.summary.fullMask'))}</span>
          <strong>${escapeHtml(fullMask)}</strong>
        </div>
        <div class="check-scorecard-kpi check-scorecard-kpi--global">
          <span>${escapeHtml(app.t('check-scorecard.summary.globalActive'))}</span>
          <strong>${escapeHtml(globalCount)}</strong>
        </div>
        <div class="check-scorecard-kpi check-scorecard-kpi--confirmed">
          <span>${escapeHtml(app.t('check-scorecard.summary.fullConfirmed'))}</span>
          <strong>${escapeHtml(fullCount)}</strong>
        </div>
      </div>
    `;
  }

  function renderHelp() {
    const parts = [app.t('check-scorecard.help.global'), app.t('check-scorecard.help.distances')];
    return `<div class="check-scorecard-help"><span>i</span>${escapeHtml(parts.join(' · '))}</div>`;
  }

  function renderTable(canWrite) {
    const numDistances = Number(state.context?.numDistances || 0);
    return `
      <div class="check-scorecard-table-wrap">
        <table class="check-scorecard-table">
          <thead>
            <tr>
              <th class="check-scorecard-col-target">${escapeHtml(app.t('check-scorecard.table.target'))}</th>
              <th class="check-scorecard-col-archer">${escapeHtml(app.t('check-scorecard.table.archer'))}</th>
              <th>${escapeHtml(app.t('check-scorecard.table.total'))}</th>
              <th>${escapeHtml(app.t('check-scorecard.table.quConfirm'))}</th>
              <th class="check-scorecard-col-confirmations">
                ${escapeHtml(app.t('check-scorecard.table.confirmations'))}
                <small>${escapeHtml(app.t('check-scorecard.table.confirmationsHint', { count: numDistances }))}</small>
              </th>
            </tr>
          </thead>
          <tbody>
            ${state.rows.map((row) => renderRow(row, canWrite)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRow(row, canWrite) {
    return `
      <tr>
        <td class="check-scorecard-target"><strong>${escapeHtml(row.target)}</strong></td>
        <td>
          <div class="check-scorecard-archer">${escapeHtml(row.firstName)} ${escapeHtml(row.lastName)}</div>
          <div class="ffta-muted check-scorecard-meta">${escapeHtml(row.license)} · ${escapeHtml(row.category)} · ${escapeHtml(row.clubCode)}</div>
        </td>
        <td>${renderScoreBlock({ score: row.totalScore, hits: row.totalHits, gold: row.totalGold, xnine: row.totalXnine, tieBreak: row.tieBreak, isTotal: true })}</td>
        <td>${renderMask(row)}</td>
        <td class="check-scorecard-confirm-grid-cell">
          <div class="check-scorecard-confirm-grid">
            ${renderGlobalCell(row, canWrite)}
            ${row.distances.map((distance) => renderDistanceCell(row, distance, canWrite)).join('')}
          </div>
        </td>
      </tr>
    `;
  }

  function renderScoreBlock({ score, hits, gold, xnine, tieBreak, arrowString, isTotal = false }) {
    return `
      <div class="check-scorecard-score-block">
        <strong>${escapeHtml(score)}</strong>
        <span>${escapeHtml(app.t('check-scorecard.table.tieBreaks', { gold, xnine, hits }))}</span>
        ${tieBreak ? `<code>${escapeHtml(app.t('check-scorecard.table.shootOff', { value: tieBreak }))}</code>` : ''}
        ${!isTotal ? (arrowString ? `<code title="${escapeAttribute(arrowString)}">${escapeHtml(arrowString)}</code>` : `<em>${escapeHtml(app.t('check-scorecard.table.noArrows'))}</em>`) : ''}
      </div>
    `;
  }

  function renderMask(row) {
    const maxBitIndex = Number(state.context?.numDistances || 0);
    const binary = Number(row.quConfirm || 0).toString(2).padStart(maxBitIndex + 1, '0');
    const chips = Array.from({ length: maxBitIndex + 1 }, (_, index) => {
      const bitIndex = maxBitIndex - index;
      const bit = 2 ** bitIndex;
      const active = (Number(row.quConfirm) & bit) !== 0;
      return `<span class="${active ? 'is-on' : ''}">b${escapeHtml(bitIndex)}</span>`;
    }).join('');
    return `
      <div class="check-scorecard-mask">
        <strong>${escapeHtml(row.quConfirm)}</strong>
        <code>${escapeHtml(binary)}</code>
        <div class="check-scorecard-bits">${chips}</div>
      </div>
    `;
  }

  function renderGlobalCell(row, canWrite) {
    return renderToggleCell({
      row,
      distance: 0,
      confirmed: Boolean(row.globalConfirmed),
      title: app.t('check-scorecard.table.global'),
      bit: 1,
      body: `<div class="check-scorecard-global-state">${escapeHtml(app.t(row.globalConfirmed ? 'check-scorecard.status.globalOn' : 'check-scorecard.status.globalOff'))}</div>`,
      canWrite
    });
  }

  function renderDistanceCell(row, distance, canWrite) {
    const body = renderScoreBlock({
      score: distance.score,
      hits: distance.hits,
      gold: distance.gold,
      xnine: distance.xnine,
      arrowString: distance.arrowString
    });
    return renderToggleCell({
      row,
      distance: distance.index,
      confirmed: Boolean(distance.confirmed),
      title: app.t('check-scorecard.table.distance', { index: distance.index }),
      bit: distance.bit,
      body,
      canWrite
    });
  }

  function renderToggleCell({ row, distance, confirmed, title, bit, body, canWrite }) {
    const key = `${row.id}:${distance}`;
    const saving = state.savingKeys.has(key);
    const nextConfirmed = !confirmed;
    return `
      <div class="check-scorecard-toggle-card ${confirmed ? 'is-confirmed' : 'is-open'}">
        <div class="check-scorecard-toggle-content">
          <div class="check-scorecard-toggle-head">
            <span class="check-scorecard-toggle-title">${escapeHtml(title)}</span>
            <span>${escapeHtml(app.t('check-scorecard.table.bit', { bit }))}</span>
          </div>
          <span class="check-scorecard-status">${escapeHtml(app.t(confirmed ? 'check-scorecard.status.confirmed' : 'check-scorecard.status.open'))}</span>
          <div class="check-scorecard-toggle-body">${body}</div>
          <div class="check-scorecard-toggle-actions">
            <button type="button" class="cp-button ${nextConfirmed ? 'cp-button--primary' : 'cp-button--secondary'}" data-action="set-confirm" data-row-id="${escapeAttribute(row.id)}" data-distance="${escapeAttribute(distance)}" data-confirmed="${nextConfirmed ? '1' : '0'}" ${saving || !canWrite ? 'disabled' : ''}>
              ${escapeHtml(app.t(saving ? 'check-scorecard.actions.saving' : (nextConfirmed ? 'check-scorecard.actions.confirm' : 'check-scorecard.actions.unconfirm')))}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function captureFocus() {
    const el = document.activeElement;
    if (!el || !root.contains(el)) return null;
    if (el.dataset?.filter) return { filter: el.dataset.filter };
    if (el.dataset?.action) return { action: el.dataset.action, rowId: el.dataset.rowId, distance: el.dataset.distance };
    return null;
  }

  function restoreFocus(focused) {
    if (!focused) return;
    let el = null;
    if (focused.filter) {
      el = root.querySelector(`[data-filter="${focused.filter}"]`);
    } else if (focused.action && focused.rowId && focused.distance !== undefined) {
      el = root.querySelector(`[data-action="${focused.action}"][data-row-id="${CSS.escape(String(focused.rowId))}"][data-distance="${CSS.escape(String(focused.distance))}"]`);
    }
    el?.focus?.();
  }

  function handleInput(event) {
    const filter = event.target.closest('[data-filter]');
    if (!filter) return;
    vm.setFilter(filter.dataset.filter, filter.value);
    if (event.type === 'change') vm.loadRows();
  }

  function handleClick(event) {
    const target = event.target.closest('[data-action]');
    const action = target?.dataset.action;
    if (action === 'load') vm.loadRows();
    if (action === 'set-confirm') {
      vm.setConfirm({
        rowId: target.dataset.rowId,
        distance: Number(target.dataset.distance),
        confirmed: target.dataset.confirmed === '1'
      });
    }
  }

  root.addEventListener('change', handleInput);
  root.addEventListener('click', handleClick);

  return function unmountCheckScorecardPage() {
    unsubscribe();
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
