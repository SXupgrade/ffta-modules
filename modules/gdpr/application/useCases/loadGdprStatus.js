export async function loadGdprStatus({ store, repository }) {
  store.setLoading(true);
  store.setError(null);
  try {
    const data = await repository.getStatus();
    store.setStatus(data);
    return data;
  } catch (error) {
    store.setError(error.message || String(error));
    throw error;
  } finally {
    store.setLoading(false);
  }
}
