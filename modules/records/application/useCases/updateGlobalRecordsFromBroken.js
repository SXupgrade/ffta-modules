export async function updateGlobalRecordsFromBroken({ store, repository }) {
  store.setSaving(true);
  store.setError(null);
  try {
    const result = await repository.updateGlobalRecordsFromBroken();
    const data = await repository.getRecordsDashboard();
    store.setData(data);
    return result?.data ?? result;
  } catch (error) {
    store.setError(error.message || String(error));
    throw error;
  } finally {
    store.setSaving(false);
  }
}
