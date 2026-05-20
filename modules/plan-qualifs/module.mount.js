import routes from './module.routes.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };
import { createIanseoPlanQualifsRepository } from './repositories/ianseo/IanseoPlanQualifsRepository.js';

export async function mountModule(app) {
  app.i18n.registerNamespace('plan-qualifs', { en, fr });

  const repository = createIanseoPlanQualifsRepository({ app });
  app.services.register('plan-qualifs.repository', repository);

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'plan-qualifs',
    label: app.t('plan-qualifs.navigation.title'),
    route: '/plan-qualifs',
    accentColor: '#35b558'
  });

  return { module: 'plan-qualifs' };
}
