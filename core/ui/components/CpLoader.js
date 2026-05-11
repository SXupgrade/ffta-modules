/**
 * @param {{ label?: string }} props
 * @returns {string} HTML string
 */
export function CpLoader({ label = '' } = {}) {
  return `
    <div class="cp-loader" role="status" aria-live="polite">
      <span class="cp-loader__spinner" aria-hidden="true"></span>
      ${label ? `<span class="cp-loader__label">${label}</span>` : ''}
    </div>
  `;
}
