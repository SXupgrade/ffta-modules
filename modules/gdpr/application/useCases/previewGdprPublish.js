export async function previewGdprPublish({ store, repository, selection }) {
  store.setError(null);
  try {
    const preview = await repository.previewPublish(selection);
    store.setPreview(preview);
    return preview;
  } catch (error) {
    store.setError(error.message || String(error));
    throw error;
  }
}
