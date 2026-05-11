import test from 'node:test';
import assert from 'node:assert/strict';
import input from './fixtures/basic-league-input.json' assert { type: 'json' };
import { calculateLeagueStandings } from '../domain/league.standings.js';

test('calculates standings grouped by class/division', () => {
  const result = calculateLeagueStandings(input);
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].groupKey, 'CLH');
  assert.equal(result.groups[0].rows[0].teamCode, 'CLUB_A');
  assert.equal(result.groups[0].rows[0].totalPoints, 9);
});
