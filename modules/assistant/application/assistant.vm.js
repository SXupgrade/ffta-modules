import { ASSISTANT_PHASES, getItemsByPhase } from '../domain/assistant.catalog.js';
import { applyDomainEvent, STATUS } from '../domain/assistant.engine.js';
import { scanAssistantMetrics } from '../domain/assistant.scanner.js';

const DEMO_EVENTS = [
  'pdf.scorecards.printed',
  'backup.created',
  'live.enabled',
  'export.federal.generated',
  'record.checked'
];

export function createAssistantViewModel({ app, store }) {
  const state = store.getState();
  state.__store = store;

  function sync() { Object.assign(state, store.getState(), { __store: store }); }
  store.subscribe(sync);

  async function scanDatabase() {
    store.setState({ isLoading: true, error: null });
    try {
      const metrics = await scanAssistantMetrics({ data: app.data });
      store.setState({ metrics, isLoading: false, error: null });
    } catch (error) {
      store.setState({ isLoading: false, error: error?.message || String(error) });
    }
  }

  function setStatus(itemId, status) {
    const normalized = [STATUS.DONE, STATUS.NA, STATUS.TODO].includes(status) ? status : STATUS.TODO;
    const statuses = { ...store.getState().statuses };
    if (normalized === STATUS.TODO) delete statuses[itemId];
    else statuses[itemId] = normalized;
    store.setState({ statuses, error: null });
  }

  function selectPhase(phase) { store.setState({ selectedPhase: phase || 'all' }); }

  function addEvent(type) {
    const events = applyDomainEvent(store.getState().events, { type });
    store.setState({ events, error: null });
  }

  function resetChecklist() { store.setState({ statuses: {}, events: [], error: null }); }

  function getVisibleItems() {
    const phase = store.getState().selectedPhase;
    if (!phase || phase === 'all') return store.getState().items;
    return store.getState().items.filter((item) => item.phase === phase);
  }

  function getTimeline() { return getItemsByPhase(getVisibleItems()); }
  function getPhaseTabs() { return ['all', ...ASSISTANT_PHASES.map((phase) => phase.id)]; }

  return { state, demoEvents: DEMO_EVENTS, scanDatabase, setStatus, selectPhase, addEvent, resetChecklist, getVisibleItems, getTimeline, getPhaseTabs };
}
