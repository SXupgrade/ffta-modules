export function createInitialGdprState() {
  return {
    activeTab: 'participants',
    isLoading: false,
    isPublishing: false,
    error: null,
    tournamentId: null,
    optedOutCount: 0,
    credentialsConfigured: false,
    events: { individual: [], team: [] },
    preview: null,
    lastResult: null,
    participants: [],
    isLoadingParticipants: false,
    savingParticipantIds: []
  };
}
