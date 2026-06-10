export async function loadRecordsDashboard({ store, repository }) {
  store.setLoading(true);
  store.setError(null);
  try {
    const data = await repository.getRecordsDashboard();
    store.setData(data);
    return data;
  } catch (error) {
    store.setError(error.message || String(error));
    throw error;
  } finally {
    store.setLoading(false);
  }
}
