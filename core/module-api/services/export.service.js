export function createExportService() {
  return {
    csv(filename, rows) {
      if (!Array.isArray(rows) || rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      const lines = [
        headers.join(','),
        ...rows.map((row) =>
          headers.map((key) => csvCell(row[key])).join(',')
        )
      ];
      triggerDownload(filename, 'text/csv;charset=utf-8;', '﻿' + lines.join('\r\n'));
    },

    json(filename, data) {
      triggerDownload(filename, 'application/json', JSON.stringify(data, null, 2));
    },

    pdf(filename, documentModel) {
      openPrintView(filename, documentModel);
    }
  };
}

function csvCell(value) {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function triggerDownload(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function openPrintView(filename, documentModel) {
  const title = documentModel?.title ?? filename;
  const calculatedAt = documentModel?.calculatedAt
    ? new Date(documentModel.calculatedAt).toLocaleString()
    : '';
  const groups = documentModel?.groups ?? [];

  let body = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: system-ui, sans-serif; font-size: 12px; color: #111; margin: 24px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { color: #555; font-size: 11px; margin-bottom: 16px; }
        h2 { font-size: 14px; margin: 16px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th, td { padding: 5px 8px; border: 1px solid #ddd; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        td.num { text-align: right; }
        @media print {
          button { display: none; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <button onclick="window.print()" style="margin-bottom:16px;padding:6px 14px;cursor:pointer;">Print / Save as PDF</button>
      <h1>${escapeHtml(title)}</h1>
      ${calculatedAt ? `<p class="meta">Calculated: ${escapeHtml(calculatedAt)}</p>` : ''}
  `;

  for (const group of groups) {
    body += `<h2>${escapeHtml(group.groupKey ?? '')}</h2>`;
    body += '<table><thead><tr><th>#</th><th>Team</th><th>Total</th></tr></thead><tbody>';
    for (const row of (group.rows ?? [])) {
      body += `<tr>
        <td class="num">${row.rank}</td>
        <td>${escapeHtml(row.teamName ?? row.teamCode ?? '')}</td>
        <td class="num">${row.totalPoints}</td>
      </tr>`;
    }
    body += '</tbody></table>';
  }

  body += '</body></html>';

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(body);
    win.document.close();
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
