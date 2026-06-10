export async function importRecords({ store, repository, options = {} }) {
  const preview = store.state.importPreview;
  if (!preview || preview.validRows.length === 0) {
    throw new Error('No valid records to import.');
  }

  store.setSaving(true);
  store.setError(null);
  try {
    await repository.importRecords({
      areaCode: options.areaCode,
      team: options.team,
      para: options.para,
      targetTournament: 0,
      rows: preview.validRows
    });
    store.setImportPreview(null);
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
