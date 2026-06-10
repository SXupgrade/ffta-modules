export function mountEArcheryPage({ root, vm, app }) {
  vm = vm || getOptionalService(app, 'earchery.vm');
  if (!vm) {
    root.innerHTML = `<div class="ffta-page"><div class="cp-alert cp-alert--danger">${escapeHtml(app?.t?.('app.errors.moduleUnavailable') || 'Module unavailable: view model was not initialized.')}</div></div>`;
    return function unmount() {};
  }
  let unsubscribe = null;
  let animationFrame = null;
  let resizeObserver = null;

  function render() {
    root.innerHTML = buildHtml(vm.state, vm, app);
    syncArenaSize();
  }

  function loop() {
    const target = vm.tick();
    if (target) updateTargetElement(target);
    animationFrame = requestAnimationFrame(loop);
  }

  function handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'start') vm.start();
    if (action === 'reset') vm.reset();
  }

  function handlePointerDown(event) {
    if (event.target.closest('[data-action]')) return;
    const arena = event.target.closest('[data-earchery-arena]');
    if (!arena || vm.state.status !== 'running') return;
    event.preventDefault();
    const rect = arena.getBoundingClientRect();
    const scaleX = vm.state.arena.width / rect.width;
    const scaleY = vm.state.arena.height / rect.height;
    vm.shoot({
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    });
  }

  function updateTargetElement(target) {
    const targetNode = root.querySelector('[data-earchery-target]');
    if (!targetNode) return;
    targetNode.style.left = `${target.x}px`;
    targetNode.style.top = `${target.y}px`;
  }

  function syncArenaSize() {
    const arena = root.querySelector('[data-earchery-arena]');
    if (!arena) return;
    const rect = arena.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      vm.resizeArena({ width: rect.width, height: rect.height });
    }
  }

  unsubscribe = vm.state.__store ? vm.state.__store.subscribe(render) : null;
  root.addEventListener('click', handleClick);
  root.addEventListener('pointerdown', handlePointerDown);
  render();

  const arena = root.querySelector('[data-earchery-arena]');
  if (globalThis.ResizeObserver && arena) {
    resizeObserver = new ResizeObserver(syncArenaSize);
    resizeObserver.observe(arena);
  }
  animationFrame = requestAnimationFrame(loop);

  return function unmount() {
    if (unsubscribe) unsubscribe();
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (resizeObserver) resizeObserver.disconnect();
    root.removeEventListener('click', handleClick);
    root.removeEventListener('pointerdown', handlePointerDown);
  };
}

function buildHtml(state, vm, app) {
  const target = state.target;
  const targetStyle = [
    `left:${target.x}px`,
    `top:${target.y}px`,
    `width:${target.radius * 2}px`,
    `height:${target.radius * 2}px`,
    `margin-left:-${target.radius}px`,
    `margin-top:-${target.radius}px`
  ].join(';');
  const actionLabel = state.status === 'running' ? app.t('earchery.actions.restart') : app.t('earchery.actions.start');
  const isLocked = state.status !== 'running';

  return `
    <section class="ffta-page earchery-page">
      <div class="ffta-page__header earchery-hero">
        <div>
          <p class="earchery-kicker">${escapeHtml(app.t('earchery.kicker'))}</p>
          <h1>${escapeHtml(app.t('earchery.title'))}</h1>
          <p class="ffta-muted">${escapeHtml(app.t('earchery.description'))}</p>
        </div>
        <span class="ffta-badge earchery-badge">${escapeHtml(app.t('earchery.badge'))}</span>
      </div>

      <div class="earchery-layout">
        <article class="cp-card earchery-game-card">
          <div class="earchery-card-header">
            <div>
              <h2>${escapeHtml(app.t('earchery.arena.title'))}</h2>
              <p>${escapeHtml(app.t('earchery.arena.help'))}</p>
            </div>
            <div class="earchery-actions">
              <button type="button" class="cp-button cp-button--primary" data-action="start">${escapeHtml(actionLabel)}</button>
              <button type="button" class="cp-button" data-action="reset">${escapeHtml(app.t('earchery.actions.reset'))}</button>
            </div>
          </div>

          <div class="earchery-message">${escapeHtml(vm.getMessage())}</div>

          <div class="earchery-arena ${isLocked ? 'is-locked' : ''}" data-earchery-arena>
            <div class="earchery-target" data-earchery-target style="${escapeAttribute(targetStyle)}" aria-hidden="true">
              <span class="ring ring-5"></span>
              <span class="ring ring-6"></span>
              <span class="ring ring-7"></span>
              <span class="ring ring-8"></span>
              <span class="ring ring-9"></span>
              <span class="ring ring-x"></span>
            </div>
            ${buildImpacts(state)}
            ${isLocked ? `<div class="earchery-overlay">${escapeHtml(app.t(state.status === 'finished' ? 'earchery.arena.finished' : 'earchery.arena.idle'))}</div>` : ''}
          </div>
        </article>

        <aside class="earchery-side">
          ${buildStats(state, vm, app)}
          ${buildShots(state, app)}
        </aside>
      </div>
    </section>
  `;
}

function buildStats(state, vm, app) {
  const shotCount = state.shots.length;
  const bestShot = state.bestShot ? `${state.bestShot.label} · ${state.bestShot.distance}px` : '—';
  return `
    <article class="cp-card earchery-stats-card">
      <div class="earchery-stat"><span>${escapeHtml(app.t('earchery.stats.score'))}</span><strong>${state.score}</strong></div>
      <div class="earchery-stat"><span>${escapeHtml(app.t('earchery.stats.bestScore'))}</span><strong>${state.bestScore || 0}</strong></div>
      <div class="earchery-stat"><span>${escapeHtml(app.t('earchery.stats.shots'))}</span><strong>${shotCount}/12</strong></div>
      <div class="earchery-stat"><span>${escapeHtml(app.t('earchery.stats.accuracy'))}</span><strong>${vm.getAccuracy()}%</strong></div>
      <div class="earchery-stat earchery-stat--wide"><span>${escapeHtml(app.t('earchery.stats.bestShot'))}</span><strong>${escapeHtml(bestShot)}</strong></div>
    </article>
  `;
}

function buildShots(state, app) {
  if (!state.shots.length) {
    return `
      <article class="cp-card earchery-shots-card">
        <h2>${escapeHtml(app.t('earchery.history.title'))}</h2>
        <p class="ffta-muted">${escapeHtml(app.t('earchery.history.empty'))}</p>
      </article>
    `;
  }

  const rows = state.shots.slice().reverse().map((shot) => `
    <div class="earchery-shot-row">
      <span>${escapeHtml(app.t('earchery.history.shot'))} ${shot.number}</span>
      <strong>${escapeHtml(shot.label)}</strong>
      <em>${shot.points} pts</em>
    </div>
  `).join('');

  return `
    <article class="cp-card earchery-shots-card">
      <h2>${escapeHtml(app.t('earchery.history.title'))}</h2>
      <div class="earchery-shot-list">${rows}</div>
    </article>
  `;
}

function buildImpacts(state) {
  return state.shots.slice(-12).map((shot) => `
    <span class="earchery-impact ${shot.points === 0 ? 'is-miss' : ''}" style="left:${shot.x}px;top:${shot.y}px" title="${escapeAttribute(`${shot.label} · ${shot.points} pts`)}">${escapeHtml(shot.label)}</span>
  `).join('');
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
