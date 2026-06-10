import routes from './module.routes.js';
import { createAchievementsStore } from './application/achievements.store.js';
import { createAchievementsViewModel } from './application/achievements.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('achievements', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'achievements',
    label: app.t('achievements.navigation.title'),
    route: '/achievements'
  });

  const store = createAchievementsStore({ storage: app.runtime?.storage });
  const vm = createAchievementsViewModel({ app, store });

  app.services.register('achievements.vm', vm);

  return { vm };
}
