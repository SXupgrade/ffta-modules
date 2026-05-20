import routes from './module.routes.js';
import { createLeagueStore } from './application/league.store.js';
import { createLeagueViewModel } from './application/league.vm.js';
import { createLeagueCalculator } from './domain/league.standings.js';
import { createIanseoLeagueRepository } from './repositories/ianseo/IanseoLeagueRepository.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('league', { en, fr });

  app.settings.registerSchema('league', {
    roundTournamentCodes: { type: 'array', defaultValue: [] },
    groupBy: { type: 'string', defaultValue: 'division-class' },
    qualificationPointsGrid: { type: 'array', defaultValue: [] },
    matchPointsMode: { type: 'string', defaultValue: 'match-wins' },
    matchWinPoints: { type: 'number', defaultValue: 1 },
    bracketPointsGrid: { type: 'array', defaultValue: [] }
  });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'league',
    label: app.t('league.navigation.title'),
    route: '/league'
  });

  const repository = createIanseoLeagueRepository({ app });
  const calculator = createLeagueCalculator();
  const store = createLeagueStore();
  const vm = createLeagueViewModel({ app, store, repository, calculator });

  app.services.register('league.vm', vm);
  app.services.register('league.repository', repository);

  return { vm };
}
