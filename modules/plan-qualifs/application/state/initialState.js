export function createInitialPlanQualifsState() {
  return {
    isLoading: false,
    isSaving: false,
    error: null,
    sessionId: 1,
    grouping: 0,
    search: '',
    showAssigned: true,
    showArchers: true,
    context: null,
    sessions: [],
    session: null,
    recap: [],
    groups: [],
    participants: [],
    unassigned: [],
    targets: []
  };
}
