export async function deleteRecordArea({ store, repository, areaCode }) {
  store.setSaving(true);
  store.setError(null);
  try {
    await repository.deleteRecordArea({ areaCode });
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
