const REQUIRED_ALIASES = {
  recordCode: ['recordCode', 'code', 'areaCode', 'rtRecCode', 'RtRecCode'],
  category: ['category', 'eventCode', 'class', 'event', 'recordCategory', 'rtRecCategory', 'RtRecCategory'],
  recordLabel: ['recordLabel', 'label', 'distance', 'recordDistance', 'rtRecDistance', 'RtRecDistance'],
  total: ['total', 'score', 'record', 'rtRecTotal', 'RtRecTotal']
};

export const CANONICAL_RECORD_FIELDS = [
  'recordCode',
  'recordLabel',
  'category',
  'categoryName',
  'total',
  'maxScore',
  'tieBreaker',
  'holderName',
  'holderClubOrCountry',
  'place',
  'date',
  'isTeam',
  'isMixed',
  'isPara',
  'source'
];

export function createRecordsExportDocument(records, { schemaVersion = '1.0' } = {}) {
  return {
    schemaVersion,
    records: normalizeRecordsForExport(records)
  };
}

export function normalizeRecordsForExport(records) {
  return (Array.isArray(records) ? records : []).map((record) => {
    const row = {
      recordCode: stringValue(record.recordCode ?? record.areaCode ?? record.RtRecCode),
      recordLabel: stringValue(record.recordLabel ?? record.distance ?? record.RtRecDistance),
      category: stringValue(record.category ?? record.RtRecCategory),
      categoryName: stringValue(record.categoryName ?? record.eventName ?? record.RtRecCategoryName),
      total: numberValue(record.total ?? record.score ?? record.RtRecTotal),
      maxScore: numberValue(record.maxScore ?? record.RtRecMaxScore),
      tieBreaker: numberValue(record.tieBreaker ?? record.xNine ?? record.RtRecXNine),
      holderName: stringValue(record.holderName ?? record.archer ?? record.holder?.name),
      holderClubOrCountry: stringValue(record.holderClubOrCountry ?? record.noc ?? record.holder?.clubOrCountry),
      place: stringValue(record.place ?? record.location ?? record.holder?.place),
      date: dateValue(record.date ?? record.recordDate ?? record.RtRecDate),
      isTeam: booleanNumber(record.isTeam ?? record.team ?? record.RtRecTeam),
      isMixed: booleanNumber(record.isMixed ?? record.isDouble ?? record.double ?? record.RtRecDouble),
      isPara: booleanNumber(record.isPara ?? record.para ?? record.RtRecPara),
      source: stringValue(record.source ?? '')
    };

    return CANONICAL_RECORD_FIELDS.reduce((out, field) => {
      out[field] = row[field];
      return out;
    }, {});
  });
}

export function parseRecordsImport(text, { format = 'auto' } = {}) {
  const raw = String(text ?? '').trim();
  if (!raw) {
    return { rows: [], validRows: [], errors: [{ line: 0, message: 'Empty import content.' }] };
  }

  const rows = detectFormat(raw, format) === 'json'
    ? parseJson(raw)
    : parseCsv(raw);

  const validRows = [];
  const errors = [];

  rows.forEach((row, index) => {
    const normalized = normalizeRecordRow(row);
    const missing = ['recordCode', 'category', 'distance', 'total'].filter((key) => normalized[key] === '' || normalized[key] == null || normalized[key] === 0 && key === 'total');
    if (missing.length > 0) {
      errors.push({ line: index + 1, message: `Missing required fields: ${missing.join(', ')}` });
      return;
    }
    validRows.push(normalized);
  });

  return { rows, validRows, errors };
}

function detectFormat(raw, format) {
  if (format !== 'auto') return format;
  return raw.startsWith('[') || raw.startsWith('{') ? 'json' : 'csv';
}

function parseJson(raw) {
  const decoded = JSON.parse(raw);
  if (Array.isArray(decoded)) return decoded;
  if (Array.isArray(decoded.records)) return decoded.records;
  return [decoded];
}

function parseCsv(raw) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const separator = detectSeparator(lines[0]);
  const headers = splitCsvLine(lines[0], separator).map((value) => value.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, separator);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
}

function detectSeparator(headerLine) {
  const candidates = [';', ',', '\t'];
  return candidates
    .map((separator) => ({ separator, count: splitCsvLine(headerLine, separator).length }))
    .sort((a, b) => b.count - a.count)[0].separator;
}

function splitCsvLine(line, separator) {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      out.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  out.push(current);
  return out.map((value) => value.trim().replace(/^"|"$/g, ''));
}

function normalizeRecordRow(row) {
  const category = valueFromAliases(row, REQUIRED_ALIASES.category).toUpperCase();
  const division = stringValue(row.division ?? row.recordDivision ?? row.rtRecDivision ?? row.RtRecDivision) || inferDivisionFromCategory(category);
  const holderName = stringValue(row.holderName ?? row.archer ?? row.athlete ?? row.name ?? row.rtRecArcher ?? row.RtRecArcher);
  const holderClubOrCountry = stringValue(row.holderClubOrCountry ?? row.noc ?? row.NOC ?? row.countryCode ?? row.clubCode ?? row.rtRecNoc ?? row.RtRecNoc);
  const holderLabel = stringValue(row.holderLabel ?? row.eventNoc ?? row.EventNOC ?? row.countryName ?? row.clubName ?? row.rtRecEventNoc ?? row.RtRecEventNoc) || holderClubOrCountry;
  const place = stringValue(row.place ?? row.location ?? row.recordPlace ?? row.rtRecPlace ?? row.RtRecPlace);

  const normalized = {
    recordCode: valueFromAliases(row, REQUIRED_ALIASES.recordCode).toUpperCase(),
    category,
    categoryName: stringValue(row.categoryName ?? row.eventName ?? row.recordCategoryName ?? row.rtRecCategoryName ?? row.RtRecCategoryName),
    localCategory: stringValue(row.localCategory ?? row.rtRecLocalCategory ?? row.RtRecLocalCategory),
    equivalents: stringValue(row.equivalents ?? row.categoryEquivalents ?? row.rtRecCatEquivalents ?? row.RtRecCatEquivalents),
    localEquivalents: stringValue(row.localEquivalents ?? row.rtRecLocalEquivalents ?? row.RtRecLocalEquivalents),
    division: division.toUpperCase(),
    distance: valueFromAliases(row, REQUIRED_ALIASES.recordLabel),
    total: numberValue(valueFromAliases(row, REQUIRED_ALIASES.total)),
    xNine: numberValue(row.tieBreaker ?? row.xNine ?? row.x10 ?? row.x ?? row.rtRecXNine ?? row.RtRecXNine),
    date: dateValue(row.date ?? row.recordDate ?? row.rtRecDate ?? row.RtRecDate),
    phase: numberValue(row.phase ?? row.rtRecPhase ?? row.RtRecPhase ?? 1),
    subphase: numberValue(row.subphase ?? row.rtRecSubphase ?? row.RtRecSubphase ?? 0),
    double: booleanNumber(row.isMixed ?? row.isDouble ?? row.double ?? row.rtRecDouble ?? row.RtRecDouble),
    meters: numberValue(row.meters ?? row.rtRecMeters ?? row.RtRecMeters ?? 0),
    maxScore: numberValue(row.maxScore ?? row.rtRecMaxScore ?? row.RtRecMaxScore ?? 0),
    components: numberValue(row.components ?? row.rtRecComponents ?? row.RtRecComponents ?? 1),
    targetCode: stringValue(row.targetCode ?? row.rtRecTargetCode ?? row.RtRecTargetCode),
    target: stringValue(row.target ?? row.rtRecTarget ?? row.RtRecTarget),
    team: booleanNumber(row.isTeam ?? row.team ?? row.rtRecTeam ?? row.RtRecTeam),
    para: booleanNumber(row.isPara ?? row.para ?? row.rtRecPara ?? row.RtRecPara),
    noc: holderClubOrCountry,
    eventNoc: holderLabel,
    archer: holderName,
    place,
    extra: stringValue(row.extra ?? row.note ?? row.rtRecExtra ?? row.RtRecExtra)
  };

  if (!normalized.categoryName) normalized.categoryName = normalized.category;
  if (!normalized.localCategory) normalized.localCategory = normalized.category;
  if (!normalized.equivalents) normalized.equivalents = normalized.category;
  if (!normalized.localEquivalents) normalized.localEquivalents = normalized.localCategory;
  if (normalized.components <= 0) normalized.components = 1;
  return normalized;
}

function inferDivisionFromCategory(category) {
  const value = String(category ?? '').toUpperCase();
  const knownDivisions = ['CL', 'CO', 'BB', 'AD', 'AC', 'AN', 'OL', 'CU', 'W1'];
  return knownDivisions.find((division) => value.endsWith(division)) ?? '';
}

function valueFromAliases(row, aliases) {
  for (const alias of aliases) {
    if (row[alias] != null && String(row[alias]).trim() !== '') return stringValue(row[alias]);
  }
  return '';
}

function stringValue(value) {
  return String(value ?? '').trim();
}

function numberValue(value) {
  const normalized = String(value ?? '0').trim().replace(',', '.');
  const numeric = Number.parseInt(normalized, 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function booleanNumber(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'oui', 'o'].includes(raw)) return 1;
  return 0;
}

function dateValue(value) {
  const raw = stringValue(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const frenchMatch = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (frenchMatch) {
    return `${frenchMatch[3]}-${frenchMatch[2].padStart(2, '0')}-${frenchMatch[1].padStart(2, '0')}`;
  }
  return '0000-00-00';
}
