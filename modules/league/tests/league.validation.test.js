import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLeagueInput } from '../domain/league.validation.js';

test('warns when no round is configured', () => {
  const warnings = validateLeagueInput({ settings: { masterTournamentCode: 'M', roundTournamentCodes: [] } });
  assert.equal(warnings.some((warning) => warning.code === 'missing-rounds'), true);
});
