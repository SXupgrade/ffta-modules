import routes from './module.routes.js';
import { createRulebookStore } from './application/rulebook.store.js';
import { createRulebookViewModel } from './application/rulebook.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('rulebook', { en, fr });

  for (const route of routes) app.routes.register(route);

  app.menu.register({
    id: 'rulebook',
    label: app.t('rulebook.navigation.title'),
    route: '/rulebook'
  });

  const store = createRulebookStore({ storage: app.runtime?.storage });
  const vm = createRulebookViewModel({ app, store });
  app.services.register('rulebook.vm', vm);

  return { vm };
}
