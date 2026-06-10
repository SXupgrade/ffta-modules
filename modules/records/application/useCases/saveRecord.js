export async function saveRecord({ app, store, repository, input }) {
  store.setSaving(true);
  store.setError(null);
  try {
    const targetTournament = input.scope === 'tournament' ? 'current' : 0;
    await repository.saveRecord({
      targetTournament,
      original: input.original,
      record: input.record
    });
    await app.services.get('records.vm').load();
  } catch (error) {
    store.setError(error.message || String(error));
    throw error;
  } finally {
    store.setSaving(false);
  }
}
