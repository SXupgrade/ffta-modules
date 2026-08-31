export async function publishGdprResults({ store, repository, selection }) {
  store.setPublishing(true);
  store.setError(null);
  try {
    const result = await repository.publish(selection);
    store.setLastResult(result);
    return result;
  } catch (error) {
    store.setError(error.message || String(error));
    throw error;
  } finally {
    store.setPublishing(false);
  }
}
