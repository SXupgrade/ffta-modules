/**
 * @param {{ columns: Array<{key:string, label:string, align?:string}>, rows: Object[], className?: string }} props
 * @returns {string} HTML string
 */
export function CpTable({ columns = [], rows = [], className = '' } = {}) {
  const thead = `
    <thead>
      <tr>
        ${columns.map((col) => `<th class="cp-table__th${col.align ? ' cp-table__th--' + col.align : ''}">${col.label}</th>`).join('')}
      </tr>
    </thead>
  `;

  const tbody = `
    <tbody>
      ${rows.length === 0
        ? `<tr><td class="cp-table__empty" colspan="${columns.length}">—</td></tr>`
        : rows.map((row) => `
          <tr>
            ${columns.map((col) => {
              const val = row[col.key] ?? '';
              return `<td class="cp-table__td${col.align ? ' cp-table__td--' + col.align : ''}">${escapeHtml(String(val))}</td>`;
            }).join('')}
          </tr>
        `).join('')
      }
    </tbody>
  `;

  return `<div class="cp-table-wrap"><table class="cp-table${className ? ' ' + className : ''}">${thead}${tbody}</table></div>`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
