export function RecordsHeader({ app, title, tournamentName }) {
  return `
    <header class="records-header">
      <div>
        <h1 class="records-header__title">${escapeHtml(title)}</h1>
        <span class="records-header__subtitle">${escapeHtml(tournamentName || app.t('records.header.noTournament'))}</span>
      </div>
      <span class="records-header__badge">${escapeHtml(app.t('records.header.ianseoCompatible'))}</span>
    </header>
  `;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
