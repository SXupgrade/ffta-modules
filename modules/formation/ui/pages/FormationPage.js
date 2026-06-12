export function mountFormationPage({ root, vm, app }) {
  vm = vm || app.services.get?.('formation.vm');
  if (!vm) { root.innerHTML = '<div class="ffta-page">Formation module unavailable.</div>'; return () => {}; }

  function render() { root.innerHTML = buildHtml(vm, app); }
  async function handleClick(event) {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'select-lesson') { vm.selectLesson(action.dataset.lessonId); render(); }
    if (action.dataset.action === 'refresh') await vm.refresh();
    if (action.dataset.action === 'validate') await vm.validateCurrentLesson();
    if (action.dataset.action === 'reset') await vm.resetProgress();
  }

  const unsubscribe = vm.state.__store.subscribe(render);
  root.addEventListener('click', handleClick);
  vm.refresh();
  render();
  return () => { unsubscribe(); root.removeEventListener('click', handleClick); };
}

function buildHtml(vm, app) {
  const state = vm.state;
  const snapshot = state.snapshot || {};
  const completion = vm.getCompletion();
  const selectedLesson = vm.getSelectedLesson();
  const progress = state.progress || {};
  const archerName = snapshot.sample?.archer || app.t('formation.dynamic.defaultArcher');
  return `
    <section class="ffta-page formation-page">
      <div class="ffta-page__header formation-hero">
        <div>
          <p class="formation-kicker">${escapeHtml(app.t('formation.kicker'))}</p>
          <h1>${escapeHtml(app.t('formation.title'))}</h1>
          <p class="ffta-muted">${escapeHtml(app.t('formation.description'))}</p>
        </div>
        <div class="formation-score"><strong>${completion.percent}%</strong><span>${completion.done}/${completion.total}</span></div>
      </div>

      ${state.error ? `<div class="cp-alert cp-alert--danger">${escapeHtml(state.error)}</div>` : ''}

      <div class="formation-context cp-card">
        <h2>${escapeHtml(app.t('formation.context.title'))}</h2>
        ${snapshot.tournament ? `
          <p><strong>${escapeHtml(snapshot.tournament.name || snapshot.tournament.code)}</strong> · ${escapeHtml(snapshot.tournament.code || '')}</p>
          <p class="ffta-muted">${escapeHtml(app.t('formation.context.stats', snapshot.stats || {}))}</p>
          <p class="formation-live">${escapeHtml(app.t('formation.context.liveExample', { archer: archerName }))}</p>
        ` : `<p class="ffta-muted">${escapeHtml(app.t('formation.context.noTournament'))}</p>`}
        <button class="cp-button" data-action="refresh">${escapeHtml(app.t('formation.actions.refresh'))}</button>
        <button class="cp-button" data-action="reset">${escapeHtml(app.t('formation.actions.reset'))}</button>
      </div>

      <div class="formation-layout">
        <aside class="formation-lessons cp-card">
          <h2>${escapeHtml(app.t('formation.lessons.title'))}</h2>
          ${vm.course.lessons.map((lesson, index) => lessonButton({ lesson, index, selectedLesson, progress, app })).join('')}
        </aside>
        <main class="formation-detail cp-card">
          <p class="formation-step">${escapeHtml(app.t('formation.lessonNumber', { number: vm.course.lessons.indexOf(selectedLesson) + 1, total: vm.course.lessons.length }))}</p>
          <h2>${escapeHtml(app.t(selectedLesson.titleKey))}</h2>
          <p>${escapeHtml(app.t(selectedLesson.goalKey, { archer: archerName }))}</p>
          ${validationHtml(progress[selectedLesson.id], app)}
          <div class="formation-actions">
            <button class="cp-button cp-button--primary" data-action="validate" ${state.loading ? 'disabled' : ''}>${escapeHtml(app.t('formation.actions.validate'))}</button>
          </div>
        </main>
      </div>
    </section>`;
}

function lessonButton({ lesson, index, selectedLesson, progress, app }) {
  const done = progress[lesson.id]?.completed;
  const active = selectedLesson.id === lesson.id;
  return `<button class="formation-lesson ${active ? 'is-active' : ''}" data-action="select-lesson" data-lesson-id="${escapeAttribute(lesson.id)}">
    <span>${done ? '✓' : index + 1}</span><strong>${escapeHtml(app.t(lesson.titleKey))}</strong>
  </button>`;
}

function validationHtml(entry, app) {
  if (!entry) return `<p class="ffta-muted">${escapeHtml(app.t('formation.validation.notChecked'))}</p>`;
  return `<div class="formation-validation ${entry.completed ? 'is-ok' : 'is-ko'}">
    <strong>${escapeHtml(app.t(entry.completed ? 'formation.validation.ok' : 'formation.validation.ko'))}</strong>
    ${(entry.results || []).map((result) => `<p>${result.ok ? '✓' : '•'} ${escapeHtml(result.message)}</p>`).join('')}
  </div>`;
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function escapeAttribute(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }
