export async function movePlanQualifsArcher({ repository, participantId, sessionId, targetNumber, slotOrder, grouping }) {
  return repository.moveArcher({ participantId, sessionId, targetNumber, slotOrder, grouping });
}
