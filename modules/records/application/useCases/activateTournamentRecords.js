export async function activateTournamentRecords({ store, repository, input }) {
  const recordCodes = String(input?.recordCodes ?? '')
    .split(/[;,\s]+/)
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  if (recordCodes.length === 0) {
    throw new Error('No record code selected.');
  }

  store.setSaving(true);
  store.setError(null);
  try {
    const result = await repository.activateTournamentRecords({
      recordCodes,
      team: input?.team ? 1 : 0,
      para: input?.para ? 1 : 0,
      headerCode: input?.headerCode,
      header: input?.header,
      color: input?.color
    });
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
