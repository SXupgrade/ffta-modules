import routes from './module.routes.js';
import { createPrintsAdapterStore } from './application/printsAdapter.store.js';
import { createPrintsAdapterViewModel } from './application/printsAdapter.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('printsAdapter', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'prints-adapter',
    label: app.t('printsAdapter.navigation.title'),
    route: '/prints-adapter'
  });

  const store = createPrintsAdapterStore();
  const vm = createPrintsAdapterViewModel({ app, store });
  app.services.register('prints-adapter.vm', vm);
  return { vm };
}
