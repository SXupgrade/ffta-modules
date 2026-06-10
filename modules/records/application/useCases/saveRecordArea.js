export async function saveRecordArea({ store, repository, input }) {
  store.setSaving(true);
  store.setError(null);
  try {
    await repository.saveRecordArea(input);
    const data = await repository.getRecordsDashboard();
    store.setData(data);
    return data;
  } catch (error) {
    store.setError(error.message || String(error));
    throw error;
  } finally {
    store.setSaving(false);
  }
}
