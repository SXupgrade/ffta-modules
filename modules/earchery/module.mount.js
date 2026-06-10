import routes from './module.routes.js';
import { createEArcheryStore } from './application/earchery.store.js';
import { createEArcheryViewModel } from './application/earchery.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('earchery', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'earchery',
    label: app.t('earchery.navigation.title'),
    route: '/earchery'
  });

  const store = createEArcheryStore({ storage: app.runtime?.storage });
  const vm = createEArcheryViewModel({ app, store });

  app.services.register('earchery.vm', vm);

  return { vm };
}
