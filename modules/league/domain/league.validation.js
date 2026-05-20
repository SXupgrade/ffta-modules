import { MAX_LEAGUE_ROUNDS } from './constants/league.constants.js';

export function validateLeagueInput(input) {
  const warnings = [...(input?.warnings ?? [])];
  const roundCodes = input?.settings?.roundTournamentCodes ?? [];

  if (!input?.settings?.masterTournamentCode) {
    warnings.push({ level: 'error', code: 'missing-master', messageKey: 'league.warnings.missingMaster' });
  }

  if (roundCodes.length === 0) {
    warnings.push({ level: 'warning', code: 'missing-rounds', messageKey: 'league.warnings.missingRounds' });
  }

  if (roundCodes.length > MAX_LEAGUE_ROUNDS) {
    warnings.push({ level: 'error', code: 'too-many-rounds', messageKey: 'league.warnings.tooManyRounds', params: { max: MAX_LEAGUE_ROUNDS } });
  }

  return dedupeWarnings(warnings);
}

function dedupeWarnings(warnings) {
  const seen = new Set();
  return warnings.filter((warning) => {
    const key = `${warning.code}:${JSON.stringify(warning.params ?? {})}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
