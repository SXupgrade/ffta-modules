import { createPlanQualifsStore } from './planQualifs.store.js';
import { loadPlanQualifsPage } from './useCases/loadPlanQualifsPage.js';
import { movePlanQualifsArcher } from './useCases/movePlanQualifsArcher.js';
import { clearPlanQualifsTarget } from './useCases/clearPlanQualifsTarget.js';
import { clearPlanQualifsSession } from './useCases/clearPlanQualifsSession.js';

export function createPlanQualifsViewModel({ app, repository }) {
  const store = createPlanQualifsStore();

  function applyPlanResult(result) {
    store.patch({
      isLoading: false,
      isSaving: false,
      error: null,
      context: result.context || null,
      sessions: result.sessions || [],
      session: result.session || null,
      sessionId: result.selectedSessionId || store.state.sessionId,
      grouping: Number(result.grouping ?? store.state.grouping),
      recap: result.recap || [],
      groups: result.groups || [],
      participants: result.participants || [],
      unassigned: result.unassigned || [],
      targets: result.targets || []
    });
  }

  async function load({ sessionId = store.state.sessionId, grouping = store.state.grouping } = {}) {
    store.patch({ isLoading: true, error: null, sessionId: Number(sessionId), grouping: Number(grouping) });
    try {
      const result = await loadPlanQualifsPage({ repository, sessionId: Number(sessionId), grouping: Number(grouping) });
      applyPlanResult(result);
    } catch (error) {
      store.patch({ isLoading: false, isSaving: false, error });
      app.notify.error(app.t('plan-qualifs.errors.loadFailed'));
    }
  }

  async function moveArcher({ participantId, targetNumber, slotOrder }) {
    store.patch({ isSaving: true, error: null });
    try {
      const result = await movePlanQualifsArcher({
        repository,
        participantId: Number(participantId),
        sessionId: store.state.sessionId,
        targetNumber: Number(targetNumber),
        slotOrder: Number(slotOrder),
        grouping: store.state.grouping
      });
      applyPlanResult(result);
    } catch (error) {
      store.patch({ isSaving: false, error });
      app.notify.error(app.t('plan-qualifs.errors.saveFailed'));
    }
  }

  async function clearTarget(targetNumber) {
    store.patch({ isSaving: true, error: null });
    try {
      const result = await clearPlanQualifsTarget({
        repository,
        sessionId: store.state.sessionId,
        targetNumber: Number(targetNumber),
        grouping: store.state.grouping
      });
      applyPlanResult(result);
    } catch (error) {
      store.patch({ isSaving: false, error });
      app.notify.error(app.t('plan-qualifs.errors.saveFailed'));
    }
  }

  async function clearSession() {
    store.patch({ isSaving: true, error: null });
    try {
      const result = await clearPlanQualifsSession({
        repository,
        sessionId: store.state.sessionId,
        grouping: store.state.grouping
      });
      applyPlanResult(result);
    } catch (error) {
      store.patch({ isSaving: false, error });
      app.notify.error(app.t('plan-qualifs.errors.saveFailed'));
    }
  }


  async function moveTarget({ sourceTarget, destinationTarget }) {
    store.patch({ isSaving: true, error: null });
    try {
      const result = await repository.moveTarget({
        sessionId: store.state.sessionId,
        sourceTarget: Number(sourceTarget),
        destinationTarget: Number(destinationTarget),
        grouping: store.state.grouping
      });
      applyPlanResult(result);
    } catch (error) {
      store.patch({ isSaving: false, error });
      app.notify.error(app.t('plan-qualifs.errors.saveFailed'));
    }
  }

  async function deleteArcher(participantId) {
    store.patch({ isSaving: true, error: null });
    try {
      const result = await repository.deleteArcher({
        participantId: Number(participantId),
        sessionId: store.state.sessionId,
        grouping: store.state.grouping
      });
      applyPlanResult(result);
    } catch (error) {
      store.patch({ isSaving: false, error });
      app.notify.error(app.t('plan-qualifs.errors.saveFailed'));
    }
  }

  async function getGlobalRecap() {
    return repository.getGlobalRecap();
  }

  return {
    state: store.state,
    subscribe: store.subscribe,
    load,
    reload: () => load(),
    changeSession: (sessionId) => load({ sessionId: Number(sessionId), grouping: store.state.grouping }),
    changeGrouping: (grouping) => load({ sessionId: store.state.sessionId, grouping: Number(grouping) }),
    setSearch: (search) => store.patch({ search: String(search || '') }),
    setShowAssigned: (showAssigned) => store.patch({ showAssigned: Boolean(showAssigned) }),
    setShowArchers: (showArchers) => store.patch({ showArchers: Boolean(showArchers) }),
    moveArcher,
    clearTarget,
    clearSession,
    moveTarget,
    deleteArcher,
    getGlobalRecap
  };
}
