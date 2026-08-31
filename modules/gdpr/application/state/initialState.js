export function createInitialGdprState() {
  return {
    isLoading: false,
    isPublishing: false,
    error: null,
    tournamentId: null,
    optedOutCount: 0,
    credentialsConfigured: false,
    events: { individual: [], team: [] },
    preview: null,
    lastResult: null
  };
}
