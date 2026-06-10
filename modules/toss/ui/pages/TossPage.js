export function mountTossPage({ root, vm, app }) {
  vm = vm || getOptionalService(app, 'toss.vm');
  if (!vm) {
    root.innerHTML = `<div class="ffta-page"><div class="cp-alert cp-alert--danger">${escapeHtml(app?.t?.('app.errors.moduleUnavailable') || 'Module unavailable: view model was not initialized.')}</div></div>`;
    return function unmount() {};
  }
  let unsubscribe = null;

  function render() {
    root.innerHTML = buildHtml(vm.state, vm, app);
  }

  function handleInput(event) {
    const field = event.target.closest('[data-field]')?.dataset.field;
    if (!field) return;
    vm.updateForm({ [field]: event.target.value });
  }

  async function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    switch (action) {
      case 'prepare':
        await vm.prepare();
        break;
      case 'reveal':
        await vm.reveal();
        break;
      case 'reset':
        vm.reset();
        break;
      case 'copyProof':
        await vm.copyProof();
        break;
      case 'exportProof':
        vm.exportCurrentJson();
        break;
      case 'exportHistory':
        vm.exportHistoryJson();
        break;
      case 'clearHistory':
        vm.clearHistory();
        break;
      case 'verifyProof':
        await vm.verifyProofText(root.querySelector('[data-field="proofText"]')?.value || '');
        break;
    }
  }

  unsubscribe = vm.state.__store ? vm.state.__store.subscribe(render) : null;
  root.addEventListener('input', handleInput);
  root.addEventListener('click', handleClick);
  render();

  return function unmount() {
    if (unsubscribe) unsubscribe();
    root.removeEventListener('input', handleInput);
    root.removeEventListener('click', handleClick);
  };
}

function buildHtml(state, vm, app) {
  const current = state.current;
  const isPrepared = current?.status === 'prepared';
  const isRevealed = current?.status === 'revealed';
  const options = vm.getOptionsPreview();

  return `
    <section class="ffta-page toss-page">
      <div class="ffta-page__header toss-hero">
        <div>
          <p class="toss-kicker">${escapeHtml(app.t('toss.kicker'))}</p>
          <h1>${escapeHtml(app.t('toss.title'))}</h1>
          <p class="ffta-muted">${escapeHtml(app.t('toss.description'))}</p>
        </div>
        <span class="ffta-badge toss-badge">${escapeHtml(app.t('toss.badge'))}</span>
      </div>

      ${state.error ? `<div class="ffta-badge ffta-badge--error toss-error">${escapeHtml(state.error)}</div>` : ''}

      <div class="toss-grid">
        <article class="cp-card toss-card toss-card--form">
          <div class="toss-card__header">
            <h2>${escapeHtml(app.t('toss.form.title'))}</h2>
            <p>${escapeHtml(app.t('toss.form.subtitle'))}</p>
          </div>

          <div class="toss-field">
            <label for="toss-mode">${escapeHtml(app.t('toss.form.mode'))}</label>
            <select id="toss-mode" data-field="mode" ${current ? 'disabled' : ''}>
              <option value="coin" ${state.mode === 'coin' ? 'selected' : ''}>${escapeHtml(app.t('toss.modes.coin'))}</option>
              <option value="draw" ${state.mode === 'draw' ? 'selected' : ''}>${escapeHtml(app.t('toss.modes.draw'))}</option>
            </select>
          </div>

          <div class="toss-field">
            <label for="toss-label">${escapeHtml(app.t('toss.form.label'))}</label>
            <input id="toss-label" data-field="label" value="${escapeAttribute(state.label)}" placeholder="${escapeAttribute(app.t('toss.form.labelPlaceholder'))}" ${current ? 'disabled' : ''}>
          </div>

          ${state.mode === 'draw' ? `
            <div class="toss-field">
              <label for="toss-options">${escapeHtml(app.t('toss.form.options'))}</label>
              <textarea id="toss-options" data-field="optionsText" rows="7" ${current ? 'disabled' : ''}>${escapeHtml(state.optionsText)}</textarea>
              <p class="ffta-muted ffta-small">${escapeHtml(app.t('toss.form.optionsHelp'))}</p>
            </div>
          ` : ''}

          <div class="toss-options-preview">
            ${options.map((option) => `<span>${escapeHtml(translateCoinOption(option, app))}</span>`).join('')}
          </div>

          <div class="toss-actions">
            <button type="button" class="cp-button cp-button--primary" data-action="prepare" ${current || state.isBusy ? 'disabled' : ''}>${escapeHtml(app.t('toss.actions.prepare'))}</button>
            <button type="button" class="cp-button cp-button--primary" data-action="reveal" ${!isPrepared || state.isBusy ? 'disabled' : ''}>${escapeHtml(app.t('toss.actions.reveal'))}</button>
            <button type="button" class="cp-button" data-action="reset" ${!current || state.isBusy ? 'disabled' : ''}>${escapeHtml(app.t('toss.actions.reset'))}</button>
          </div>
        </article>

        <article class="cp-card toss-card toss-result-card ${isRevealed ? 'is-revealed' : ''}">
          <div class="toss-card__header">
            <h2>${escapeHtml(app.t('toss.result.title'))}</h2>
            <p>${escapeHtml(app.t('toss.result.subtitle'))}</p>
          </div>
          ${current ? buildCurrentResult({ current, app }) : buildEmptyResult(app)}
        </article>
      </div>

      <div class="toss-grid toss-grid--proof">
        <article class="cp-card toss-card">
          <div class="toss-card__header toss-card__header--inline">
            <div>
              <h2>${escapeHtml(app.t('toss.proof.title'))}</h2>
              <p>${escapeHtml(app.t('toss.proof.subtitle'))}</p>
            </div>
            <div class="toss-actions toss-actions--compact">
              <button type="button" class="cp-button" data-action="copyProof" ${!state.proofText ? 'disabled' : ''}>${escapeHtml(app.t('toss.actions.copyProof'))}</button>
              <button type="button" class="cp-button" data-action="exportProof" ${!current ? 'disabled' : ''}>${escapeHtml(app.t('toss.actions.exportProof'))}</button>
              <button type="button" class="cp-button" data-action="verifyProof" ${!state.proofText ? 'disabled' : ''}>${escapeHtml(app.t('toss.actions.verifyProof'))}</button>
            </div>
          </div>
          <textarea class="toss-proof" data-field="proofText" rows="12" placeholder="${escapeAttribute(app.t('toss.proof.placeholder'))}">${escapeHtml(state.proofText || '')}</textarea>
        </article>

        <article class="cp-card toss-card">
          <div class="toss-card__header toss-card__header--inline">
            <div>
              <h2>${escapeHtml(app.t('toss.history.title'))}</h2>
              <p>${escapeHtml(app.t('toss.history.subtitle'))}</p>
            </div>
            <div class="toss-actions toss-actions--compact">
              <button type="button" class="cp-button" data-action="exportHistory" ${(state.history || []).length ? '' : 'disabled'}>${escapeHtml(app.t('toss.actions.exportHistory'))}</button>
              <button type="button" class="cp-button" data-action="clearHistory" ${(state.history || []).length ? '' : 'disabled'}>${escapeHtml(app.t('toss.actions.clearHistory'))}</button>
            </div>
          </div>
          ${buildHistory(state.history || [], app)}
        </article>
      </div>
    </section>
  `;
}

function buildCurrentResult({ current, app }) {
  const result = current.result ? translateCoinOption(current.result, app) : app.t('toss.result.pending');
  return `
    <div class="toss-result">
      <div class="toss-result__value">${escapeHtml(result)}</div>
      <dl class="toss-proof-list">
        <div><dt>${escapeHtml(app.t('toss.result.status'))}</dt><dd>${escapeHtml(app.t(`toss.status.${current.status}`))}</dd></div>
        <div><dt>${escapeHtml(app.t('toss.result.commitment'))}</dt><dd title="${escapeAttribute(current.commitment)}">${escapeHtml(shortHash(current.commitment))}</dd></div>
        <div><dt>${escapeHtml(app.t('toss.result.seed'))}</dt><dd title="${escapeAttribute(current.seed)}">${escapeHtml(shortHash(current.seed))}</dd></div>
        ${current.drawHash ? `<div><dt>${escapeHtml(app.t('toss.result.drawHash'))}</dt><dd title="${escapeAttribute(current.drawHash)}">${escapeHtml(shortHash(current.drawHash))}</dd></div>` : ''}
      </dl>
      <p class="ffta-muted ffta-small">${escapeHtml(app.t('toss.result.explanation'))}</p>
    </div>
  `;
}

function buildEmptyResult(app) {
  return `
    <div class="toss-empty-result">
      <div class="toss-empty-result__icon">🪙</div>
      <p>${escapeHtml(app.t('toss.result.empty'))}</p>
    </div>
  `;
}

function buildHistory(history, app) {
  if (!history.length) {
    return `<p class="ffta-muted">${escapeHtml(app.t('toss.history.empty'))}</p>`;
  }
  return `
    <div class="toss-history-list">
      ${history.map((item) => `
        <div class="toss-history-item">
          <div>
            <strong>${escapeHtml(translateCoinOption(item.result || app.t('toss.result.pending'), app))}</strong>
            <span>${escapeHtml(item.label || item.id || '')}</span>
          </div>
          <time>${escapeHtml(formatDate(item.revealedAt || item.createdAt))}</time>
        </div>
      `).join('')}
    </div>
  `;
}

function translateCoinOption(option, app) {
  if (option === 'HEADS') return app.t('toss.coin.heads');
  if (option === 'TAILS') return app.t('toss.coin.tails');
  return option;
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function shortHash(value) {
  const text = String(value || '');
  if (text.length <= 18) return text;
  return `${text.slice(0, 10)}…${text.slice(-8)}`;
}


function getOptionalService(app, serviceId) {
  try {
    return app?.services?.get?.(serviceId) || null;
  } catch (error) {
    return null;
  }
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
