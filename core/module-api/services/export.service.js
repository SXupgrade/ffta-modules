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

    text(filename, content) {
      triggerDownload(filename, 'text/plain;charset=utf-8', String(content ?? ''));
    },

    createTextExport({ filename = 'export.txt', content = '' } = {}) {
      triggerDownload(filename, 'text/plain;charset=utf-8', String(content ?? ''));
    },

    validateFftaTxt(content) {
      const lines = String(content ?? '').split(/\r?\n/).filter(Boolean);
      const errors = [];
      if (!lines.length) errors.push('Export is empty.');
      lines.forEach((line, index) => {
        if (line.length < 5) errors.push(`Line ${index + 1} is suspiciously short.`);
      });
      return { ok: errors.length === 0, errors, lineCount: lines.length };
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
  const labels = documentModel?.labels ?? {};
  const rounds = Array.isArray(documentModel?.rounds) ? documentModel.rounds : [];
  const calculatedAt = documentModel?.calculatedAt
    ? new Date(documentModel.calculatedAt).toLocaleString()
    : '';
  const groups = documentModel?.groups ?? [];

  const printLabel = labels.print ?? 'Print / Save as PDF';
  const calculatedLabel = labels.calculated ?? 'Calculated';

  let body = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 10px; color: #111; margin: 18px; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        .meta { color: #555; font-size: 10px; margin: 0 0 14px; }
        h2 { font-size: 13px; margin: 16px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th, td { padding: 4px 5px; border: 1px solid #ddd; text-align: left; vertical-align: middle; }
        th { background: #f5f5f5; font-weight: 600; }
        .num { text-align: right; white-space: nowrap; }
        .center { text-align: center; }
        .muted { color: #555; font-size: 9px; }
        .total { font-weight: 700; }
        .round-header { text-align: center; }
        .print-button { margin-bottom: 16px; padding: 6px 14px; cursor: pointer; }
        @media print {
          button { display: none; }
          body { margin: 0; }
          @page { size: landscape; margin: 1.1cm; }
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">${escapeHtml(printLabel)}</button>
      <h1>${escapeHtml(title)}</h1>
      ${calculatedAt ? `<p class="meta">${escapeHtml(calculatedLabel)}: ${escapeHtml(calculatedAt)}</p>` : ''}
  `;

  for (const group of groups) {
    body += renderGroupTable({ group, rounds, labels });
  }

  body += '</body></html>';

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(body);
    win.document.close();
  }
}

function renderGroupTable({ group, rounds, labels }) {
  const rows = group?.rows ?? [];
  const title = group?.groupKey ?? '';

  let header = `
    <tr>
      <th class="center">${escapeHtml(labels.rank ?? '#')}</th>
      <th>${escapeHtml(labels.team ?? 'Team')}</th>
  `;
  for (let i = 0; i < rounds.length; i++) {
    const roundLabel = formatLabel(labels.round ?? 'Round {index}', { index: i + 1 });
    const roundName = rounds[i]?.name || rounds[i]?.code || roundLabel;
    header += `<th class="round-header" colspan="7">${escapeHtml(roundLabel)}<br><span class="muted">${escapeHtml(roundName)}</span></th>`;
  }
  header += `<th class="num">${escapeHtml(labels.total ?? 'Total')}</th></tr>`;

  let subHeader = '<tr><th></th><th></th>';
  for (let i = 0; i < rounds.length; i++) {
    subHeader += `
      <th class="num muted">${escapeHtml(labels.qualRank ?? 'Q rank')}</th>
      <th class="num muted">${escapeHtml(labels.qualPts ?? 'Q pts')}</th>
      <th class="num muted">${escapeHtml(labels.matchWins ?? 'Wins')}</th>
      <th class="num muted">${escapeHtml(labels.matchPts ?? 'Win pts')}</th>
      <th class="num muted">${escapeHtml(labels.finalRank ?? 'Final rank')}</th>
      <th class="num muted">${escapeHtml(labels.finalPts ?? 'Final pts')}</th>
      <th class="num muted">${escapeHtml(labels.roundTotal ?? 'Round total')}</th>
    `;
  }
  subHeader += '<th></th></tr>';

  let body = '';
  if (rows.length === 0) {
    const colspan = 3 + rounds.length * 7;
    body = `<tr><td colspan="${colspan}">${escapeHtml(labels.noTeams ?? 'No teams')}</td></tr>`;
  } else {
    body = rows.map((row) => renderStandingRow({ row, rounds })).join('');
  }

  return `
    <h2>${escapeHtml(title)}</h2>
    <table>
      <thead>${header}${rounds.length > 0 ? subHeader : ''}</thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function renderStandingRow({ row, rounds }) {
  const roundsMap = new Map();
  for (const detail of row?.rounds ?? []) {
    roundsMap.set(detail.roundCode, detail);
  }

  let cells = `
    <td class="num">${escapeHtml(row?.rank ?? '')}</td>
    <td>${escapeHtml(row?.teamName ?? row?.teamCode ?? '')}</td>
  `;

  for (const round of rounds) {
    const detail = roundsMap.get(round.code) ?? defaultRoundDetail();
    cells += `
      <td class="num">${formatRank(detail.qualificationRank)}</td>
      <td class="num">${formatNumber(detail.qualificationPoints)}</td>
      <td class="num">${formatNumber(detail.matchWins)}</td>
      <td class="num">${formatNumber(detail.matchPoints)}</td>
      <td class="num">${formatRank(detail.finalRank)}</td>
      <td class="num">${formatNumber(detail.bracketPoints)}</td>
      <td class="num total">${formatNumber(detail.totalRoundPoints)}</td>
    `;
  }

  cells += `<td class="num total">${formatNumber(row?.totalPoints)}</td>`;
  return `<tr>${cells}</tr>`;
}

function defaultRoundDetail() {
  return {
    qualificationRank: null,
    qualificationPoints: 0,
    matchWins: 0,
    matchPoints: 0,
    finalRank: null,
    bracketPoints: 0,
    totalRoundPoints: 0
  };
}

function formatNumber(value) {
  return Number(value ?? 0);
}

function formatRank(value) {
  const number = Number(value ?? 0);
  return number > 0 ? number : '—';
}

function formatLabel(template, params) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (_, key) => params?.[key] ?? '');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
