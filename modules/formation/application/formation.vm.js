import { FORMATION_COURSE } from '../data/formation.course.js';
import { createFormationCourse, parseFormationStepsCsv } from '../domain/formation.steps.js';

export function createFormationViewModel({ app, store }) {
  const state = store.getState();
  if (!state.course) state.course = FORMATION_COURSE;
  state.__store = store;
  store.subscribe(() => Object.assign(state, store.getState(), { __store: store }));

  const apiUrl = `${app.runtime.baseUrl}modules/formation/api/formation.php`;
  const stepsUrl = `${app.runtime.baseUrl}modules/formation/data/formation.steps.csv`;

  async function refresh() {
    store.setState({ loading: true, error: '' });
    try {
      await loadCourse();
      const snapshot = await request('snapshot');
      store.setState({ snapshot, progress: snapshot.progress || {}, loading: false });
    } catch (error) {
      store.setState({ error: error.message || String(error), loading: false });
    }
  }

  async function validateCurrentLesson() {
    const lesson = getSelectedLesson();
    if (!lesson) return;
    store.setState({ loading: true, error: '' });
    try {
      const result = await request('validateLesson', { lessonId: lesson.id, scriptId: lesson.scriptVerifExercise });
      store.setState({ snapshot: result.snapshot, progress: result.progress || {}, loading: false });
      app.notify?.success?.(app.t(result.completed ? 'formation.validation.completed' : 'formation.validation.checked'));
    } catch (error) {
      store.setState({ error: error.message || String(error), loading: false });
    }
  }

  async function seedCurrentLesson() {
    const lesson = getSelectedLesson();
    if (!lesson?.scriptInitExercise) return;
    store.setState({ loading: true, error: '' });
    try {
      const result = await request('runInitScript', { lessonId: lesson.id, scriptId: lesson.scriptInitExercise });
      store.setState({ snapshot: result.snapshot, progress: result.progress || {}, exerciseInit: { ...store.getState().exerciseInit, [lesson.id]: result }, loading: false });
      app.notify?.success?.(app.t(statusKey(result.status, 'formation.seed.completed', 'formation.seed.warning', 'formation.seed.error')));
    } catch (error) {
      store.setState({ error: error.message || String(error), loading: false });
    }
  }

  async function verifyCurrentExercise() {
    const lesson = getSelectedLesson();
    if (!lesson?.canVerifyExercise) return;
    store.setState({ loading: true, error: '' });
    try {
      const result = await request('runCheckScript', { lessonId: lesson.id, scriptId: lesson.scriptVerifExercise });
      store.setState({ snapshot: result.snapshot, exerciseCheck: { ...store.getState().exerciseCheck, [lesson.id]: result }, loading: false });
      app.notify?.success?.(app.t(statusKey(result.status, 'formation.exercise.success', 'formation.exercise.warning', 'formation.exercise.error')));
    } catch (error) {
      store.setState({ error: error.message || String(error), loading: false });
    }
  }

  async function resetProgress() {
    store.setState({ loading: true, error: '' });
    try {
      const result = await request('resetProgress');
      store.setState({ snapshot: result.snapshot, progress: {}, loading: false });
    } catch (error) { store.setState({ error: error.message || String(error), loading: false }); }
  }

  function selectLesson(lessonId) { store.setState({ selectedLessonId: lessonId }); }
  function getCourse() { return store.getState().course || FORMATION_COURSE; }
  function getSelectedLesson() { const course = getCourse(); return course.lessons.find((lesson) => lesson.id === store.getState().selectedLessonId) || course.lessons[0]; }
  function getCompletion() { const course = getCourse(); const progress = store.getState().progress || {}; const done = course.lessons.filter((lesson) => progress[lesson.id]?.completed).length; return { done, total: course.lessons.length, percent: Math.round((done / course.lessons.length) * 100) }; }

  async function loadCourse() {
    try {
      const response = await fetch(stepsUrl, { cache: 'no-cache' });
      if (!response.ok) return;
      const csv = await response.text();
      const course = createFormationCourse(parseFormationStepsCsv(csv));
      store.setState({ course });
    } catch {
      store.setState({ course: FORMATION_COURSE });
    }
  }

  async function request(action, payload = {}) {
    const response = await fetch(`${apiUrl}?action=${encodeURIComponent(action)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || `Formation API error: HTTP ${response.status}`);
    return data.data;
  }

  function statusKey(status, okKey, warningKey, errorKey) {
    if (status === 'ok') return okKey;
    if (status === 'warning') return warningKey;
    return errorKey;
  }

  return { state, refresh, selectLesson, getCourse, getSelectedLesson, getCompletion, seedCurrentLesson, verifyCurrentExercise, validateCurrentLesson, resetProgress };
}
