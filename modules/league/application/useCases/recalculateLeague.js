import { loadLeagueStandings } from './loadLeagueStandings.js';

export async function recalculateLeague(context) {
  const result = await loadLeagueStandings(context);
  context.app.notify.success(context.app.t('league.messages.recalculated'));
  return result;
}
