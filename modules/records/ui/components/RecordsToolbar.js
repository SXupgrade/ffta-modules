export function RecordsToolbar({ app, state }) {
  const disabled = state.isSaving ? 'disabled' : '';
  return `
    <div class="records-toolbar ffta-toolbar">
      <button type="button" class="cp-btn" data-action="reload" ${disabled}>${escapeHtml(app.t('records.actions.reload'))}</button>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
