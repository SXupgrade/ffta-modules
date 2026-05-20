/**
 * PlanQualifsRepository contract.
 *
 * Repositories own all Ianseo-specific data access and update operations.
 * UI/ViewModel code must never call Ianseo PHP endpoints directly.
 */
export const PLAN_QUALIFS_REPOSITORY_CONTRACT = Object.freeze({
  getPlan: 'getPlan({ sessionId, grouping })',
  moveArcher: 'moveArcher({ participantId, sessionId, targetNumber, slotOrder, grouping })',
  clearTarget: 'clearTarget({ sessionId, targetNumber, grouping })',
  clearSession: 'clearSession({ sessionId, grouping })'
});
