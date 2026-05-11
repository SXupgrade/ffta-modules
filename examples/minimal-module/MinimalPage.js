/**
 * Minimal page component — demonstrates the basic rendering pattern.
 *
 * @param {{ app: Object }} props
 * @returns {string} HTML string
 */
export function MinimalPage({ app } = {}) {
  return `
    <section class="ffta-page">
      <h1>${app.t('minimal.title')}</h1>
      <p>${app.t('minimal.description')}</p>
    </section>
  `;
}
