export async function checkBrokenRecords({ store, repository }) {
  store.setSaving(true);
  store.setError(null);
  try {
    const result = await repository.checkBrokenRecords();
    const data = await repository.getRecordsDashboard();
    store.setData(data);
    return result;
  } catch (error) {
    store.setError(error.message || String(error));
    throw error;
  } finally {
    store.setSaving(false);
  }
}
