export const FORMATION_STEP_COLUMNS = [
  'stepId',
  'title',
  'objectives',
  'learningText',
  'images',
  'exercise',
  'scriptInitExercise',
  'scriptVerifExercise'
];

export function parseFormationStepsCsv(csvText) {
  const rows = parseCsv(csvText, detectDelimiter(csvText));
  if (rows.length === 0) return [];
  const headers = rows[0].map((header) => normalizeHeader(header));
  const missing = FORMATION_STEP_COLUMNS.filter((column) => !headers.includes(column.toLowerCase()));
  if (missing.length > 0) {
    throw new Error(`Formation steps file is missing column(s): ${missing.join(', ')}`);
  }

  return rows.slice(1)
    .map((row) => rowToStep(headers, row))
    .filter((step) => step.stepId);
}

export function createFormationCourse(steps) {
  return {
    id: 'ffta-ianseo-formation',
    titleKey: 'formation.course.title',
    descriptionKey: 'formation.course.description',
    lessons: steps.map((step) => ({
      ...step,
      id: step.stepId,
      hasImages: step.images.length > 0,
      hasExercise: Boolean(step.exercise),
      canInitExercise: Boolean(step.scriptInitExercise),
      canVerifyExercise: Boolean(step.scriptVerifExercise)
    }))
  };
}

function rowToStep(headers, row) {
  const values = {};
  headers.forEach((header, index) => { values[header] = String(row[index] || '').trim(); });
  return {
    stepId: values.stepid || '',
    title: values.title || '',
    objectives: values.objectives || '',
    learningText: values.learningtext || '',
    images: parseImages(values.images || ''),
    exercise: values.exercise || '',
    scriptInitExercise: values.scriptinitexercise || '',
    scriptVerifExercise: values.scriptverifexercise || ''
  };
}

function parseImages(value) {
  return String(value || '')
    .split(',')
    .map((fileName) => fileName.trim())
    .filter(Boolean)
    .filter((fileName) => !fileName.includes('/') && !fileName.includes('\\') && !fileName.startsWith('.'))
    .filter((fileName) => /\.(avif|gif|jpe?g|png|webp)$/i.test(fileName));
}

function normalizeHeader(header) {
  return String(header || '').trim().replace(/\s+/g, '').toLowerCase();
}

function detectDelimiter(text) {
  const firstLine = String(text || '').split(/\r?\n/, 1)[0] || '';
  const candidates = [',', ';', '\t'];
  let best = ',';
  let bestScore = -1;

  for (const candidate of candidates) {
    const headers = parseCsv(firstLine, candidate)[0] || [];
    const score = FORMATION_STEP_COLUMNS.filter((column) => headers.map(normalizeHeader).includes(column.toLowerCase())).length;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function parseCsv(text, delimiter = ',') {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => String(value).trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => String(value).trim() !== '')) rows.push(row);
  return rows;
}
