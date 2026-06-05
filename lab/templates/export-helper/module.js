export async function mountModule({ app, manifest }) {
  app.menu.register({ id: manifest.id, label: app.t('my-export.title'), route: '/my-export' });
}

export function mountMyExportPage({ root, app }) {
  root.innerHTML = `
    <section class="ffta-page">
      <h1>${app.t('my-export.title')}</h1>
      <button class="cp-btn cp-btn--primary" data-action="download">${app.t('my-export.download')}</button>
    </section>
  `;
  root.querySelector('[data-action="download"]').addEventListener('click', async () => {
    const scores = await app.data.scores.listQualificationScores({}, { moduleId: 'my-export' });
    app.files.downloadJson('scores-export.json', scores);
  });
}
