import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateQualificationPoints, calculateMatchWinPoints } from '../domain/league.points.js';

test('calculates qualification points from configurable grid', () => {
  const settings = { qualificationPointsGrid: [{ rank: 1, points: 10 }] };
  assert.equal(calculateQualificationPoints({ qualificationRank: 1, settings }), 10);
  assert.equal(calculateQualificationPoints({ qualificationRank: 2, settings }), 0);
});

test('calculates match win points', () => {
  const settings = { matchWinPoints: 3 };
  assert.equal(calculateMatchWinPoints({ wins: 2, settings }), 6);
});
