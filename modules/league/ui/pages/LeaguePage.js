export function LeaguePage({ vm, app }) {
  // TODO: Replace template string with project-approved rendering pattern.
  return `
    <section class="ffta-page league-page">
      <header class="league-header">
        <h1>${app.t('league.title')}</h1>
        <button data-action="recalculate">${app.t('league.actions.recalculate')}</button>
        <button data-action="exportPdf">${app.t('league.actions.exportPdf')}</button>
      </header>
      <div id="league-warnings"></div>
      <div id="league-standings"></div>
    </section>
  `;
}
