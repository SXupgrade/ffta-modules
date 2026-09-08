import routes from './module.routes.js';
import { createGdprStore } from './application/gdpr.store.js';
import { createGdprViewModel } from './application/gdpr.vm.js';
import { createIanseoGdprRepository } from './repositories/ianseo/IanseoGdprRepository.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('gdpr', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'gdpr',
    label: app.t('gdpr.navigation.title'),
    route: '/gdpr'
  });

  const repository = createIanseoGdprRepository({ app });
  const store = createGdprStore();
  const vm = createGdprViewModel({ app, store, repository });

  app.services.register('gdpr.vm', vm);
  app.services.register('gdpr.repository', repository);

  return { vm };
}
