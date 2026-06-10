export async function saveMonitoredRecord({ store, repository, input }) {
  store.setSaving(true);
  store.setError(null);
  try {
    await repository.saveMonitoredRecord(input);
    return repository.getRecordsDashboard().then((data) => {
      store.setData(data);
      return data;
    });
  } catch (error) {
    store.setError(error.message || String(error));
    throw error;
  } finally {
    store.setSaving(false);
  }
}
