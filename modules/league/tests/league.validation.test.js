import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { validateLeagueInput } from '../domain/league.validation.js';
import { MAX_LEAGUE_ROUNDS } from '../domain/constants/league.constants.js';

const require = createRequire(import.meta.url);
const tooManyInput = require('./fixtures/too-many-rounds-input.json');

test('warns when no master tournament is configured', () => {
  const warnings = validateLeagueInput({ settings: { masterTournamentCode: '', roundTournamentCodes: ['R1'] } });
  assert.ok(warnings.some((w) => w.code === 'missing-master'));
});

test('warns when no round is configured', () => {
  const warnings = validateLeagueInput({ settings: { masterTournamentCode: 'M', roundTournamentCodes: [] } });
  assert.ok(warnings.some((w) => w.code === 'missing-rounds'));
});

test('errors when too many rounds configured (9 > 8)', () => {
  const warnings = validateLeagueInput(tooManyInput);
  const tooMany = warnings.find((w) => w.code === 'too-many-rounds');
  assert.ok(tooMany);
  assert.equal(tooMany.level, 'error');
  assert.equal(tooMany.params.max, MAX_LEAGUE_ROUNDS);
});

test('no warnings when exactly 8 rounds configured', () => {
  const warnings = validateLeagueInput({
    settings: {
      masterTournamentCode: 'M',
      roundTournamentCodes: ['R1','R2','R3','R4','R5','R6','R7','R8']
    }
  });
  assert.ok(!warnings.some((w) => w.code === 'too-many-rounds'));
});

test('no warnings for valid configuration', () => {
  const warnings = validateLeagueInput({
    settings: { masterTournamentCode: 'M', roundTournamentCodes: ['R1', 'R2'] }
  });
  assert.equal(warnings.length, 0);
});

test('MAX_LEAGUE_ROUNDS constant is 8', () => {
  assert.equal(MAX_LEAGUE_ROUNDS, 8);
});
