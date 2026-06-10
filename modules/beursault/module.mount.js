import routes from './module.routes.js';
import { createBeursaultStore } from './application/beursault.store.js';
import { createBeursaultViewModel } from './application/beursault.vm.js';
import { createIanseoBeursaultRepository } from './repositories/ianseo/IanseoBeursaultRepository.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('beursault', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'beursault',
    label: app.t('beursault.navigation.title'),
    route: '/beursault'
  });

  const repository = createIanseoBeursaultRepository({ app });
  const store = createBeursaultStore();
  const vm = createBeursaultViewModel({ app, store, repository });

  app.services.register('beursault.vm', vm);
  app.services.register('beursault.repository', repository);

  return { vm };
}
