export async function loadPlanQualifsPage({ repository, sessionId, grouping }) {
  return repository.getPlan({ sessionId, grouping });
}
