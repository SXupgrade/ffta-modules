import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { calculateLeagueStandings } from '../domain/league.standings.js';

const require = createRequire(import.meta.url);
const basicInput       = require('./fixtures/basic-league-input.json');
const threeRoundsInput = require('./fixtures/three-rounds-input.json');
const bracketInput     = require('./fixtures/bracket-mode-input.json');

test('calculates standings grouped by class/division', () => {
  const result = calculateLeagueStandings(basicInput);
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].groupKey, 'HCL');
  assert.equal(result.groups[0].rows[0].teamCode, 'CLUB_A');
  assert.equal(result.groups[0].rows[0].totalPoints, 9);
});

test('CLUB_A has 5 qual points + 4 match points = 9 total', () => {
  const result = calculateLeagueStandings(basicInput);
  const row = result.groups[0].rows[0];
  assert.equal(row.qualificationPoints, 5);
  assert.equal(row.matchPoints, 4);
  assert.equal(row.totalPoints, 9);
});

test('CLUB_B has 3 qual points + 2 match points = 5 total', () => {
  const result = calculateLeagueStandings(basicInput);
  const row = result.groups[0].rows[1];
  assert.equal(row.teamCode, 'CLUB_B');
  assert.equal(row.totalPoints, 5);
});

test('calculates accumulated points over 3 rounds', () => {
  const result = calculateLeagueStandings(threeRoundsInput);
  assert.equal(result.groups.length, 1);
  const rows = result.groups[0].rows;
  // TEAM_A: R1=8, R2=6, R3=6 = 20
  // TEAM_B: R1=6, R2=8, R3=4 = 18
  // TEAM_C: R1=4, R2=4, R3=8 = 16
  assert.equal(rows[0].teamCode, 'TEAM_A');
  assert.equal(rows[0].totalPoints, 20);
  assert.equal(rows[1].teamCode, 'TEAM_B');
  assert.equal(rows[1].totalPoints, 18);
  assert.equal(rows[2].teamCode, 'TEAM_C');
  assert.equal(rows[2].totalPoints, 16);
});

test('assigns sequential ranks 1..n', () => {
  const result = calculateLeagueStandings(threeRoundsInput);
  const rows = result.groups[0].rows;
  assert.equal(rows[0].rank, 1);
  assert.equal(rows[1].rank, 2);
  assert.equal(rows[2].rank, 3);
});

test('calculates bracket ranking points mode', () => {
  const result = calculateLeagueStandings(bracketInput);
  const rows = result.groups[0].rows;
  assert.equal(rows[0].teamCode, 'GOLD');
  assert.equal(rows[0].bracketPoints, 10);
  assert.equal(rows[1].teamCode, 'SILVER');
  assert.equal(rows[1].bracketPoints, 7);
  assert.equal(rows[2].bracketPoints, 5);
  assert.equal(rows[3].bracketPoints, 3);
});

test('calculatedAt is an ISO string', () => {
  const result = calculateLeagueStandings(basicInput);
  assert.ok(typeof result.calculatedAt === 'string');
  assert.ok(!isNaN(Date.parse(result.calculatedAt)));
});

test('returns empty groups for empty teams list', () => {
  const result = calculateLeagueStandings({
    settings: { masterTournamentCode: 'X', roundTournamentCodes: ['R1'] },
    teams: [],
    rounds: [{ code: 'R1' }],
    qualificationResults: [],
    matchResults: []
  });
  assert.equal(result.groups.length, 0);
});
