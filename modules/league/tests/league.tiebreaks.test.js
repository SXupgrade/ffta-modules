import test from 'node:test';
import assert from 'node:assert/strict';
import { compareStandingRows } from '../domain/league.tiebreaks.js';

function makeRow(overrides) {
  return {
    teamCode: 'TEAM',
    teamName: 'Team',
    totalPoints: 0,
    qualificationPoints: 0,
    matchPoints: 0,
    bracketPoints: 0,
    rounds: [],
    ...overrides
  };
}

test('higher total points sorts first', () => {
  const a = makeRow({ totalPoints: 10 });
  const b = makeRow({ totalPoints: 5 });
  assert.ok(compareStandingRows(a, b) < 0, 'a (10 pts) should come before b (5 pts)');
  assert.ok(compareStandingRows(b, a) > 0, 'b (5 pts) should come after a (10 pts)');
});

test('equal total points: higher qualification points sorts first', () => {
  const a = makeRow({ totalPoints: 10, qualificationPoints: 8 });
  const b = makeRow({ totalPoints: 10, qualificationPoints: 6 });
  assert.ok(compareStandingRows(a, b) < 0);
});

test('equal total and qual points: alphabetical by team name', () => {
  const a = makeRow({ totalPoints: 10, qualificationPoints: 5, teamName: 'Alpha' });
  const b = makeRow({ totalPoints: 10, qualificationPoints: 5, teamName: 'Beta' });
  assert.ok(compareStandingRows(a, b) < 0, 'Alpha should come before Beta');
});

test('equal rows returns 0 — tie-break is deterministic', () => {
  const a = makeRow({ totalPoints: 5, qualificationPoints: 3, teamName: 'Same' });
  const b = makeRow({ totalPoints: 5, qualificationPoints: 3, teamName: 'Same' });
  assert.equal(compareStandingRows(a, b), 0);
});

test('sort is stable and deterministic for a full list', () => {
  const rows = [
    makeRow({ teamName: 'Charlie', totalPoints: 10, qualificationPoints: 5 }),
    makeRow({ teamName: 'Alpha',   totalPoints: 15, qualificationPoints: 8 }),
    makeRow({ teamName: 'Bravo',   totalPoints: 10, qualificationPoints: 7 })
  ];
  const sorted = [...rows].sort(compareStandingRows);
  assert.equal(sorted[0].teamName, 'Alpha');   // 15 pts
  assert.equal(sorted[1].teamName, 'Bravo');   // 10 pts, 7 qual
  assert.equal(sorted[2].teamName, 'Charlie'); // 10 pts, 5 qual
});
