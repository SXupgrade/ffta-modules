import routes from './module.routes.js';
import { createFormationStore } from './application/formation.store.js';
import { createFormationViewModel } from './application/formation.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('formation', { en, fr });
  for (const route of routes) app.routes.register(route);
  app.menu.register({ id: 'formation', label: app.t('formation.navigation.title'), route: '/formation' });
  const store = createFormationStore({ storage: app.runtime?.storage });
  const vm = createFormationViewModel({ app, store });
  app.services.register('formation.vm', vm);
  return { vm };
}
