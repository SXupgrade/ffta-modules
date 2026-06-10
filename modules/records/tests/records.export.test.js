import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecordsExportDocument, normalizeRecordsForExport, parseRecordsImport } from '../domain/records.import.js';

const inputRecord = {
  areaCode: 'RECORD',
  distance: 'TAE National',
  category: 'NS1HCL',
  categoryName: 'Senior 1 Homme Classique National',
  total: 675,
  maxScore: 720,
  xNine: 32,
  holderName: 'DUPONT Jean',
  holderClubOrCountry: '1300000',
  place: 'Aix-en-Provence',
  recordDate: '2026-01-01',
  team: 0,
  isDouble: 1,
  para: 0
};

test('export rows use the canonical import schema', () => {
  const [row] = normalizeRecordsForExport([inputRecord]);
  assert.deepEqual(Object.keys(row), [
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
  ]);
  assert.equal(row.recordCode, 'RECORD');
  assert.equal(row.recordLabel, 'TAE National');
  assert.equal(row.tieBreaker, 32);
  assert.equal(row.isMixed, 1);
});

test('export JSON document can be imported again', () => {
  const document = createRecordsExportDocument([inputRecord]);
  assert.equal(document.schemaVersion, '1.0');
  const result = parseRecordsImport(JSON.stringify(document));
  assert.equal(result.errors.length, 0);
  assert.equal(result.validRows.length, 1);
  assert.equal(result.validRows[0].recordCode, 'RECORD');
  assert.equal(result.validRows[0].distance, 'TAE National');
  assert.equal(result.validRows[0].xNine, 32);
  assert.equal(result.validRows[0].double, 1);
});
