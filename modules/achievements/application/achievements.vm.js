import { getCategories } from '../domain/achievements.catalog.js';
import { applyDomainEvent } from '../domain/achievements.engine.js';
import { scanAchievementMetrics } from '../domain/achievements.scanner.js';

const DEMO_EVENTS = [
  'export.federal.generated',
  'pdf.generated',
  'record.broken',
  'finals.individual.started',
  'finals.team.started',
  'live.enabled',
  'backup.created'
];

export function createAchievementsViewModel({ app, store }) {
  const state = store.getState();
  state.__store = store;

  function sync() {
    Object.assign(state, store.getState(), { __store: store });
  }

  store.subscribe(sync);

  async function scanDatabase() {
    store.setState({ isLoading: true, error: null, mode: 'scan' });
    try {
      const metrics = await scanAchievementMetrics({ data: app.data });
      store.setState({ metrics, isLoading: false, mode: 'scan' });
    } catch (error) {
      store.setState({ isLoading: false, error: error?.message || String(error) });
    }
  }

  function addEvent(type) {
    try {
      const events = applyDomainEvent(store.getState().events, { type });
      store.setState({ events, mode: 'events', error: null });
    } catch (error) {
      store.setState({ error: error?.message || String(error) });
    }
  }

  function resetEvents() {
    store.setState({ events: [], mode: 'events', error: null });
  }

  function selectCategory(category) {
    store.setState({ selectedCategory: category || 'all' });
  }

  function getVisibleAchievements() {
    const category = store.getState().selectedCategory;
    const achievements = store.getState().achievements;
    if (!category || category === 'all') return achievements;
    return achievements.filter((achievement) => achievement.category === category);
  }

  function getCategoriesList() {
    return ['all', ...getCategories()];
  }

  function t(key) {
    return app.t(`achievements.${key}`);
  }

  return {
    state,
    demoEvents: DEMO_EVENTS,
    scanDatabase,
    addEvent,
    resetEvents,
    selectCategory,
    getVisibleAchievements,
    getCategoriesList,
    t
  };
}
