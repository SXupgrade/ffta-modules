import { createResultLine } from './exportFfta.resultLine.js';
import { renderTxt } from './exportFfta.renderer.js';

export function generateDatasetExport(dataset) {
  const level = dataset.level || 'S';
  const tournamentCode = dataset.tournament?.code || '';
  const rows = Array.isArray(dataset.results) ? dataset.results : [];
  const lines = [['VERSION : ', dataset.version || 'TNR-DATASET-1']];

  for (const row of rows) {
    lines.push(createResultLine({ ...row, level, tournamentCode }));
  }

  return renderTxt(lines);
}
