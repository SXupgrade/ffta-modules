import { FORMATION_COURSE } from '../data/formation.course.js';

export function createFormationViewModel({ app, store }) {
  const state = store.getState();
  state.__store = store;
  store.subscribe(() => Object.assign(state, store.getState(), { __store: store }));

  const apiUrl = `${app.runtime.baseUrl}modules/formation/api/formation.php`;

  async function refresh() {
    store.setState({ loading: true, error: '' });
    try {
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
      const result = await request('validateLesson', { lessonId: lesson.id, validators: lesson.validators });
      store.setState({ snapshot: result.snapshot, progress: result.progress || {}, loading: false });
      app.notify?.success?.(app.t(result.completed ? 'formation.validation.completed' : 'formation.validation.checked'));
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
  function getSelectedLesson() { return FORMATION_COURSE.lessons.find((lesson) => lesson.id === store.getState().selectedLessonId) || FORMATION_COURSE.lessons[0]; }
  function getCompletion() { const progress = store.getState().progress || {}; const done = FORMATION_COURSE.lessons.filter((lesson) => progress[lesson.id]?.completed).length; return { done, total: FORMATION_COURSE.lessons.length, percent: Math.round((done / FORMATION_COURSE.lessons.length) * 100) }; }

  async function request(action, payload = {}) {
    const response = await fetch(`${apiUrl}?action=${encodeURIComponent(action)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || `Formation API error: HTTP ${response.status}`);
    return data.data;
  }

  return { state, course: FORMATION_COURSE, refresh, selectLesson, getSelectedLesson, getCompletion, validateCurrentLesson, resetProgress };
}
