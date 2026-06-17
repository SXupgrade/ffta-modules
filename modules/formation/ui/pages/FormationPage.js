export function mountFormationPage({ root, vm, app }) {
  vm = vm || app.services.get?.('formation.vm');
  if (!vm) { root.innerHTML = '<div class="ffta-page">Formation module unavailable.</div>'; return () => {}; }

  function render() { root.innerHTML = buildHtml(vm, app); }
  async function handleClick(event) {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'select-lesson') { vm.selectLesson(action.dataset.lessonId); render(); }
    if (action.dataset.action === 'refresh') await vm.refresh();
    if (action.dataset.action === 'seed') await vm.seedCurrentLesson();
    if (action.dataset.action === 'verify') await vm.verifyCurrentExercise();
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
  const exerciseInit = state.exerciseInit || {};
  const exerciseCheck = state.exerciseCheck || {};
  const archerName = snapshot.sample?.archer || app.t('formation.dynamic.defaultArcher');
  const course = vm.getCourse();
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
          <p><strong>${escapeHtml(snapshot.tournament.name || snapshot.tournament.code)}</strong> - ${escapeHtml(snapshot.tournament.code || '')}</p>
          <p class="ffta-muted">${escapeHtml(app.t('formation.context.stats', snapshot.stats || {}))}</p>
          <p class="formation-live">${escapeHtml(app.t('formation.context.liveExample', { archer: archerName }))}</p>
        ` : `<p class="ffta-muted">${escapeHtml(app.t('formation.context.noTournament'))}</p>`}
        <button class="cp-button" data-action="refresh">${escapeHtml(app.t('formation.actions.refresh'))}</button>
        <button class="cp-button" data-action="reset">${escapeHtml(app.t('formation.actions.reset'))}</button>
      </div>

      <div class="formation-layout">
        <aside class="formation-lessons cp-card">
          <h2>${escapeHtml(app.t('formation.lessons.title'))}</h2>
          ${course.lessons.map((lesson, index) => lessonButton({ lesson, index, selectedLesson, progress })).join('')}
        </aside>
        <main class="formation-detail cp-card">
          <p class="formation-step">${escapeHtml(app.t('formation.lessonNumber', { number: course.lessons.indexOf(selectedLesson) + 1, total: course.lessons.length }))}</p>
          <h2>${escapeHtml(interpolate(selectedLesson.title, { archer: archerName }))}</h2>
          <section class="formation-block">
            <h3>${escapeHtml(app.t('formation.step.objectives'))}</h3>
            <p>${escapeHtml(interpolate(selectedLesson.objectives, { archer: archerName }))}</p>
          </section>
          <section class="formation-block">
            <h3>${escapeHtml(app.t('formation.step.learningText'))}</h3>
            <p>${escapeHtml(interpolate(selectedLesson.learningText, { archer: archerName }))}</p>
          </section>
          ${imagesHtml(selectedLesson, app)}
          ${exerciseHtml(selectedLesson, exerciseInit[selectedLesson.id], exerciseCheck[selectedLesson.id], app, state.loading)}
          ${validationHtml(progress[selectedLesson.id], app)}
          <div class="formation-actions">
            <button class="cp-button cp-button--primary" data-action="validate" ${state.loading ? 'disabled' : ''}>${escapeHtml(app.t('formation.actions.validate'))}</button>
          </div>
        </main>
      </div>
    </section>`;
}

function imagesHtml(lesson, app) {
  if (!lesson?.hasImages) return '';
  return `<section class="formation-images" aria-label="${escapeAttribute(app.t('formation.step.images'))}">
    <h3>${escapeHtml(app.t('formation.step.images'))}</h3>
    <div class="formation-image-slider">
      ${lesson.images.map((image, index) => imageHtml(image, index, app)).join('')}
    </div>
  </section>`;
}

function imageHtml(image, index, app) {
  const label = app.t('formation.step.imageLabel', { number: index + 1 });
  const src = `modules/formation/data/${encodeURIComponent(image)}`;
  return `<figure class="formation-image-slide">
    <img src="${escapeAttribute(src)}" alt="${escapeAttribute(label)}" loading="lazy">
    <figcaption>${escapeHtml(label)}</figcaption>
  </figure>`;
}

function exerciseHtml(lesson, init, check, app, loading) {
  if (!lesson?.hasExercise) return '';
  return `<section class="formation-case">
    <h3>${escapeHtml(app.t('formation.step.exercise'))}</h3>
    <p>${escapeHtml(lesson.exercise)}</p>
    ${init ? scriptResultHtml(init, app, 'formation.seed.completed', 'formation.seed.warning', 'formation.seed.error') : ''}
    ${check ? exerciseCheckHtml(check, app) : ''}
    <div class="formation-actions">
      ${lesson.canInitExercise ? `<button class="cp-button" data-action="seed" ${loading ? 'disabled' : ''}>${escapeHtml(app.t('formation.actions.seed'))}</button>` : ''}
      ${lesson.canVerifyExercise ? `<button class="cp-button" data-action="verify" ${loading ? 'disabled' : ''}>${escapeHtml(app.t('formation.actions.verify'))}</button>` : ''}
    </div>
  </section>`;
}

function exerciseCheckHtml(check, app) {
  return scriptResultHtml(check, app, 'formation.exercise.success', 'formation.exercise.warning', 'formation.exercise.error');
}

function scriptResultHtml(result, app, okKey, warningKey, errorKey) {
  const statusClass = result.status === 'ok' ? 'is-ok' : result.status === 'warning' ? 'is-warning' : 'is-ko';
  const titleKey = result.status === 'ok' ? okKey : result.status === 'warning' ? warningKey : errorKey;
  return `<div class="formation-validation ${statusClass}">
    <strong>${escapeHtml(app.t(titleKey))}</strong>
    ${(result.results || []).map((item) => `<p>${statusIcon(item.status)} ${escapeHtml(item.message)}</p>`).join('')}
  </div>`;
}

function statusIcon(status) {
  if (status === 'ok') return '&check;';
  if (status === 'warning') return '!';
  return '&bull;';
}

function lessonButton({ lesson, index, selectedLesson, progress }) {
  const done = progress[lesson.id]?.completed;
  const active = selectedLesson.id === lesson.id;
  return `<button class="formation-lesson ${active ? 'is-active' : ''}" data-action="select-lesson" data-lesson-id="${escapeAttribute(lesson.id)}">
    <span>${done ? '&check;' : index + 1}</span><strong>${escapeHtml(lesson.title)}</strong>
  </button>`;
}

function validationHtml(entry, app) {
  if (!entry) return `<p class="ffta-muted">${escapeHtml(app.t('formation.validation.notChecked'))}</p>`;
  return `<div class="formation-validation ${entry.completed ? 'is-ok' : 'is-ko'}">
    <strong>${escapeHtml(app.t(entry.completed ? 'formation.validation.ok' : 'formation.validation.ko'))}</strong>
    ${(entry.results || []).map((result) => `<p>${result.ok ? '&check;' : '&bull;'} ${escapeHtml(result.message)}</p>`).join('')}
  </div>`;
}

function interpolate(value, params = {}) {
  return String(value ?? '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => params[key] ?? '');
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function escapeAttribute(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }
