// Optimistic: the checkbox flips immediately (organizer sees their own click
// take effect right away), then reverts if the write actually failed --
// simpler than a separate "pending" visual state for what should always be
// a near-instant single-row write.
export async function setGdprParticipantOptOut({ store, repository, entryId, optOut }) {
  store.setError(null);
  store.setParticipantOptedOut(entryId, optOut);
  store.setParticipantSaving(entryId, true);
  try {
    await repository.setParticipantOptOut(entryId, optOut);
  } catch (error) {
    store.setParticipantOptedOut(entryId, !optOut);
    store.setError(error.message || String(error));
    throw error;
  } finally {
    store.setParticipantSaving(entryId, false);
  }
}
