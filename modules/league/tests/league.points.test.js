import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQualificationPoints,
  calculateMatchWinPoints,
  calculateBracketPoints,
  getPointsForRank
} from '../domain/league.points.js';

test('calculates qualification points from configurable grid', () => {
  const settings = { qualificationPointsGrid: [{ rank: 1, points: 10 }, { rank: 2, points: 5 }] };
  assert.equal(calculateQualificationPoints({ qualificationRank: 1, settings }), 10);
  assert.equal(calculateQualificationPoints({ qualificationRank: 2, settings }), 5);
});

test('returns 0 when rank has no configured value', () => {
  const settings = { qualificationPointsGrid: [{ rank: 1, points: 10 }] };
  assert.equal(calculateQualificationPoints({ qualificationRank: 99, settings }), 0);
});

test('returns 0 when points grid is empty', () => {
  const settings = { qualificationPointsGrid: [] };
  assert.equal(calculateQualificationPoints({ qualificationRank: 1, settings }), 0);
});

test('returns 0 when points grid is undefined', () => {
  const settings = {};
  assert.equal(calculateQualificationPoints({ qualificationRank: 1, settings }), 0);
});

test('calculates match win points', () => {
  const settings = { matchWinPoints: 3 };
  assert.equal(calculateMatchWinPoints({ wins: 2, settings }), 6);
  assert.equal(calculateMatchWinPoints({ wins: 0, settings }), 0);
});

test('calculates match win points with fractional wins', () => {
  const settings = { matchWinPoints: 1 };
  assert.equal(calculateMatchWinPoints({ wins: 5, settings }), 5);
});

test('calculates bracket ranking points from grid', () => {
  const settings = { bracketPointsGrid: [{ rank: 1, points: 10 }, { rank: 2, points: 7 }, { rank: 3, points: 5 }] };
  assert.equal(calculateBracketPoints({ finalRank: 1, settings }), 10);
  assert.equal(calculateBracketPoints({ finalRank: 2, settings }), 7);
  assert.equal(calculateBracketPoints({ finalRank: 3, settings }), 5);
  assert.equal(calculateBracketPoints({ finalRank: 4, settings }), 0);
});

test('getPointsForRank handles string vs number rank coercion', () => {
  const grid = [{ rank: '1', points: '8' }, { rank: 2, points: 6 }];
  assert.equal(getPointsForRank(grid, 1), 8);
  assert.equal(getPointsForRank(grid, '2'), 6);
});
