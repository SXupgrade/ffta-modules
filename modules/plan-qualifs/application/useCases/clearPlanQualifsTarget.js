export async function clearPlanQualifsTarget({ repository, sessionId, targetNumber, grouping }) {
  return repository.clearTarget({ sessionId, targetNumber, grouping });
}
