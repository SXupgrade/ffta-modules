export async function syncTournamentRecordAreas({ store, repository, selectedAreaCodes }) {
  const areaCodes = Array.isArray(selectedAreaCodes)
    ? selectedAreaCodes.map((value) => String(value).trim().toUpperCase()).filter(Boolean)
    : [];

  store.setSaving(true);
  store.setError(null);
  try {
    const result = await repository.syncTournamentRecordAreas({ areaCodes });
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
