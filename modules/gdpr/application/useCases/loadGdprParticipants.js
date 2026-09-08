export async function loadGdprParticipants({ store, repository }) {
  store.setLoadingParticipants(true);
  store.setError(null);
  try {
    const data = await repository.listParticipants();
    store.setParticipants(data.participants);
    return data.participants;
  } catch (error) {
    store.setError(error.message || String(error));
    throw error;
  } finally {
    store.setLoadingParticipants(false);
  }
}
