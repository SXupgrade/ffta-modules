import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRecordsImport } from '../domain/records.import.js';

test('parse canonical semicolon CSV records', () => {
  const result = parseRecordsImport('recordCode;recordLabel;category;categoryName;total;maxScore;tieBreaker;holderName;holderClubOrCountry;place;date;isTeam;isMixed;isPara\nRECORD;TAE National;S1HCL;Sénior 1 Homme Classique;675;720;32;DUPONT Jean;1300000;Aix-en-Provence;2026-01-01;0;1;0');
  assert.equal(result.errors.length, 0);
  assert.equal(result.validRows.length, 1);
  assert.equal(result.validRows[0].recordCode, 'RECORD');
  assert.equal(result.validRows[0].category, 'S1HCL');
  assert.equal(result.validRows[0].division, 'CL');
  assert.equal(result.validRows[0].distance, 'TAE National');
  assert.equal(result.validRows[0].total, 675);
  assert.equal(result.validRows[0].maxScore, 720);
  assert.equal(result.validRows[0].xNine, 32);
  assert.equal(result.validRows[0].archer, 'DUPONT Jean');
  assert.equal(result.validRows[0].noc, '1300000');
  assert.equal(result.validRows[0].place, 'Aix-en-Provence');
  assert.equal(result.validRows[0].double, 1);
});

test('parse comma CSV with quoted values', () => {
  const result = parseRecordsImport('recordCode,recordLabel,category,total,holderName,place\nRECORD,"TAE, National",S1FCL,655,"DUPONT, Jeanne",Marseille');
  assert.equal(result.errors.length, 0);
  assert.equal(result.validRows[0].distance, 'TAE, National');
  assert.equal(result.validRows[0].archer, 'DUPONT, Jeanne');
});

test('parse JSON records wrapper', () => {
  const result = parseRecordsImport(JSON.stringify({ records: [{ recordCode: 'BEST 2025/2026', category: 'S1FBB', recordLabel: 'TAE National', score: 610 }] }));
  assert.equal(result.validRows.length, 1);
  assert.equal(result.validRows[0].total, 610);
  assert.equal(result.validRows[0].recordCode, 'BEST 2025/2026');
  assert.equal(result.validRows[0].division, 'BB');
});

test('report missing required fields', () => {
  const result = parseRecordsImport('recordCode;category;recordLabel;total\nRECORD;S1HCL;;675');
  assert.equal(result.validRows.length, 0);
  assert.equal(result.errors.length, 1);
});

test('keeps Ianseo serialized RtRecExtra when provided', () => {
  const extra = 'a:1:{i:0;O:8:"stdClass":3:{s:3:"NOC";s:3:"FRA";s:8:"EventNOC";s:6:"France";s:7:"Archers";a:0:{}}}';
  const result = parseRecordsImport(JSON.stringify([{ recordCode: 'RECORD', category: 'S1FCL', recordLabel: 'Total', total: 655, extra }]));
  assert.equal(result.errors.length, 0);
  assert.equal(result.validRows[0].extra, extra);
});
