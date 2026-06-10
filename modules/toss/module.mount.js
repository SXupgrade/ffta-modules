import routes from './module.routes.js';
import { createTossStore } from './application/toss.store.js';
import { createTossViewModel } from './application/toss.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('toss', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'toss',
    label: app.t('toss.navigation.title'),
    route: '/toss'
  });

  const store = createTossStore({ storage: app.runtime?.storage });
  const vm = createTossViewModel({ app, store });

  app.services.register('toss.vm', vm);

  return { vm };
}
