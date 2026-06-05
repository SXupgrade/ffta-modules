const MODULE_ID = 'simple-scores';

export function mountSimpleModulePage({ root, app, manifest }) {
  const moduleId = manifest?.id || MODULE_ID;
  const state = {
    loading: false,
    saving: false,
    session: '',
    rows: [],
    editingId: null,
    draft: {}
  };

  async function loadScores() {
    state.loading = true;
    render();
    try {
      const filters = state.session ? { session: Number(state.session) } : {};
      state.rows = normalizeScoreRows(await app.data.scores.readQualificationScores(filters, { moduleId }));
      state.editingId = null;
      state.draft = {};
    } catch (error) {
      app.notify.error(error.message || app.t('simple-scores.messages.loadFailed'));
    } finally {
      state.loading = false;
      render();
    }
  }

  function startEdit(row) {
    state.editingId = row.qualificationId;
    state.draft = {
      score: Number(row.total || 0),
      tens: Number(row.tens || 0),
      nines: Number(row.nines || 0)
    };
    render();
  }

  function cancelEdit() {
    state.editingId = null;
    state.draft = {};
    render();
  }

  async function saveEdit() {
    if (!canWrite(app, moduleId)) {
      app.notify.error(app.t('app.acl.writeDenied'));
      return;
    }
    const row = state.rows.find((item) => Number(item.qualificationId) === Number(state.editingId));
    if (!row) return;

    state.saving = true;
    render();
    try {
      await app.data.scores.writeQualificationScore({
        qualificationId: row.qualificationId,
        quId: row.qualificationId,
        entryId: row.entryId,
        distance: 'D1',
        score: clampScore(state.draft.score),
        tens: clampScore(state.draft.tens),
        nines: clampScore(state.draft.nines)
      }, { moduleId });
      app.notify.success(app.t('simple-scores.messages.scoreSaved'));
      await loadScores();
    } catch (error) {
      app.notify.error(error.message || app.t('simple-scores.messages.saveFailed'));
    } finally {
      state.saving = false;
      render();
    }
  }

  async function recalculateRanking() {
    if (!canWrite(app, moduleId)) {
      app.notify.error(app.t('app.acl.writeDenied'));
      return;
    }
    state.saving = true;
    render();
    try {
      const payload = state.session ? { session: Number(state.session) } : {};
      await app.data.scores.recalculateQualificationRanking(payload, { moduleId });
      app.notify.success(app.t('simple-scores.messages.rankingRecalculated'));
      await loadScores();
    } catch (error) {
      app.notify.error(error.message || app.t('simple-scores.messages.recalculateFailed'));
    } finally {
      state.saving = false;
      render();
    }
  }

  function render() {
    const access = app.acl.getCachedAccess(moduleId) || 'none';
    const readonly = access !== 'write';
    const sessions = getSessions(state.rows);
    const rows = getRankedRows(state.rows);

    root.innerHTML = `
      <section class="ffta-page simple-scores-page">
        <div class="ffta-page__header">
          <div>
            <h1>${escapeHtml(app.t('simple-scores.title'))}</h1>
            <p class="ffta-muted">${escapeHtml(app.t('simple-scores.description'))}</p>
          </div>
          <span class="ffta-badge ${readonly ? 'ffta-badge--warning' : ''}">${escapeHtml(readonly ? app.t('simple-scores.badges.readOnly') : app.t('simple-scores.badges.readWrite'))}</span>
        </div>

        <article class="cp-card simple-scores-card">
          <div class="simple-scores-toolbar">
            <label class="simple-scores-field">
              <span>${escapeHtml(app.t('simple-scores.fields.session'))}</span>
              <select data-action="change-session">
                <option value="">${escapeHtml(app.t('simple-scores.filters.allSessions'))}</option>
                ${sessions.map((session) => `<option value="${escapeAttribute(session)}" ${String(state.session) === String(session) ? 'selected' : ''}>${escapeHtml(app.t('simple-scores.filters.session', { session }))}</option>`).join('')}
              </select>
            </label>
            <button type="button" class="cp-button" data-action="reload" ${state.loading ? 'disabled' : ''}>${escapeHtml(app.t('simple-scores.actions.reload'))}</button>
            <button type="button" class="cp-button cp-button--primary" data-action="recalculate" ${readonly || state.saving ? 'disabled' : ''}>${escapeHtml(app.t('simple-scores.actions.recalculateRanking'))}</button>
          </div>

          ${readonly ? `<p class="ffta-muted simple-scores-note">${escapeHtml(app.t('simple-scores.messages.readOnlyHelp'))}</p>` : ''}
          ${state.loading ? `<p class="ffta-muted">${escapeHtml(app.t('simple-scores.messages.loading'))}</p>` : renderScoresTable({ rows, app, readonly, state })}
        </article>
      </section>
    `;
  }

  function handleInput(event) {
    const field = event.target?.dataset?.draftField;
    if (!field) return;
    state.draft[field] = event.target.value;
  }

  function handleChange(event) {
    if (event.target?.dataset?.action !== 'change-session') return;
    state.session = event.target.value;
    loadScores();
  }

  function handleClick(event) {
    const actionElement = event.target.closest('[data-action]');
    const action = actionElement?.dataset?.action;
    if (!action) return;

    if (action === 'reload') loadScores();
    if (action === 'recalculate') recalculateRanking();
    if (action === 'edit') {
      const row = state.rows.find((item) => Number(item.qualificationId) === Number(actionElement.dataset.qualificationId));
      if (row) startEdit(row);
    }
    if (action === 'cancel') cancelEdit();
    if (action === 'save') saveEdit();
  }

  root.addEventListener('input', handleInput);
  root.addEventListener('change', handleChange);
  root.addEventListener('click', handleClick);
  loadScores();

  return function unmountSimpleScoresModule() {
    root.removeEventListener('input', handleInput);
    root.removeEventListener('change', handleChange);
    root.removeEventListener('click', handleClick);
  };
}

function renderScoresTable({ rows, app, readonly, state }) {
  if (!rows.length) {
    return `<div class="ffta-empty-state"><strong>${escapeHtml(app.t('simple-scores.empty.title'))}</strong><p>${escapeHtml(app.t('simple-scores.empty.description'))}</p></div>`;
  }

  return `
    <div class="simple-scores-table-wrapper">
      <table class="simple-scores-table">
        <thead>
          <tr>
            <th>${escapeHtml(app.t('simple-scores.columns.rank'))}</th>
            <th>${escapeHtml(app.t('simple-scores.columns.target'))}</th>
            <th>${escapeHtml(app.t('simple-scores.columns.archer'))}</th>
            <th>${escapeHtml(app.t('simple-scores.columns.category'))}</th>
            <th>${escapeHtml(app.t('simple-scores.columns.score'))}</th>
            <th>${escapeHtml(app.t('simple-scores.columns.tens'))}</th>
            <th>${escapeHtml(app.t('simple-scores.columns.nines'))}</th>
            <th>${escapeHtml(app.t('simple-scores.columns.actions'))}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => renderScoreRow({ row, app, readonly, state })).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderScoreRow({ row, app, readonly, state }) {
  const isEditing = Number(state.editingId) === Number(row.qualificationId);
  if (isEditing) {
    return `
      <tr>
        <td>${escapeHtml(row.rank || '')}</td>
        <td>${escapeHtml(row.targetNo || row.target || '')}</td>
        <td><strong>${escapeHtml(row.name)}</strong><br><small>${escapeHtml(row.club || '')}</small></td>
        <td>${escapeHtml(row.division || '')} / ${escapeHtml(row.class || '')}</td>
        <td><input class="simple-scores-input" type="number" min="0" max="720" data-draft-field="score" value="${escapeAttribute(state.draft.score)}"></td>
        <td><input class="simple-scores-input" type="number" min="0" max="72" data-draft-field="tens" value="${escapeAttribute(state.draft.tens)}"></td>
        <td><input class="simple-scores-input" type="number" min="0" max="72" data-draft-field="nines" value="${escapeAttribute(state.draft.nines)}"></td>
        <td class="simple-scores-actions">
          <button type="button" class="cp-button cp-button--primary" data-action="save" ${state.saving ? 'disabled' : ''}>${escapeHtml(app.t('simple-scores.actions.save'))}</button>
          <button type="button" class="cp-button" data-action="cancel">${escapeHtml(app.t('simple-scores.actions.cancel'))}</button>
        </td>
      </tr>
    `;
  }

  return `
    <tr>
      <td><strong>${escapeHtml(row.rank || '')}</strong></td>
      <td>${escapeHtml(row.targetNo || row.target || '')}</td>
      <td><strong>${escapeHtml(row.name)}</strong><br><small>${escapeHtml(row.club || '')}</small></td>
      <td>${escapeHtml(row.division || '')} / ${escapeHtml(row.class || '')}</td>
      <td><strong>${escapeHtml(row.total)}</strong></td>
      <td>${escapeHtml(row.tens)}</td>
      <td>${escapeHtml(row.nines)}</td>
      <td><button type="button" class="cp-button" data-action="edit" data-qualification-id="${escapeAttribute(row.qualificationId)}" ${readonly ? 'disabled' : ''}>${escapeHtml(app.t('simple-scores.actions.edit'))}</button></td>
    </tr>
  `;
}

function normalizeScoreRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const distances = row.distances || {};
    const total = Number(row.total ?? row.score ?? distances.D1 ?? 0);
    return {
      ...row,
      qualificationId: Number(row.qualificationId ?? row.quId ?? row.entryId),
      entryId: Number(row.entryId ?? row.quId ?? row.qualificationId),
      name: row.name || [row.lastName, row.firstName].filter(Boolean).join(' ') || `#${row.entryId || row.quId}`,
      club: row.club || row.clubName || row.country || '',
      targetNo: row.targetNo || row.target || '',
      total,
      tens: Number(row.tens ?? row.ten ?? 0),
      nines: Number(row.nines ?? row.nine ?? 0),
      rank: row.rank ? Number(row.rank) : null
    };
  });
}

function getRankedRows(rows) {
  return [...rows].sort((left, right) => {
    const rankDiff = Number(left.rank || 999999) - Number(right.rank || 999999);
    if (rankDiff !== 0) return rankDiff;
    return Number(right.total || 0) - Number(left.total || 0);
  });
}

function getSessions(rows) {
  return [...new Set(rows.map((row) => row.session).filter((session) => session !== undefined && session !== null && session !== ''))].sort((a, b) => Number(a) - Number(b));
}

function canWrite(app, moduleId) {
  return app.acl.getCachedAccess(moduleId) === 'write';
}

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.round(number));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
