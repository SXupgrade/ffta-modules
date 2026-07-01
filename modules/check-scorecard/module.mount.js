import routes from './module.routes.js';
import { createCheckScorecardStore } from './application/checkScorecard.store.js';
import { createCheckScorecardViewModel } from './application/checkScorecard.vm.js';
import { createIanseoCheckScorecardRepository } from './repositories/ianseo/IanseoCheckScorecardRepository.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('check-scorecard', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'check-scorecard',
    label: app.t('check-scorecard.navigation.title'),
    route: '/check-scorecard'
  });

  const repository = createIanseoCheckScorecardRepository({ app });
  const store = createCheckScorecardStore();
  const vm = createCheckScorecardViewModel({ app, store, repository });

  app.services.register('check-scorecard.vm', vm);
  app.services.register('check-scorecard.repository', repository);

  return { vm };
}
