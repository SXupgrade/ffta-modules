import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearchText, searchRules } from '../domain/rulebook.search.js';

test('normalizeSearchText removes accents and lowercases text', () => {
  assert.equal(normalizeSearchText('Tir à l’Arc Extérieur'), 'tir a l’arc exterieur');
});

test('searchRules finds relevant cards by keyword', () => {
  const results = searchRules({ query: 'arbitre responsable' });
  assert.ok(results.length > 0);
  assert.ok(results.some((entry) => entry.id === 'judge-responsible-required'));
});

test('searchRules filters by discipline section', () => {
  const results = searchRules({ discipline: 'runArchery' });
  assert.deepEqual(results.map((entry) => entry.id), ['run-archery-entry']);
});

test('searchRules can keep favorites only', () => {
  const results = searchRules({ favorites: ['records-france'], onlyFavorites: true });
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'records-france');
});
