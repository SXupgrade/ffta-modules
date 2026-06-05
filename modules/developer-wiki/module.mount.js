import routes from './module.routes.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('developer-wiki', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'developer-wiki',
    label: app.t('developer-wiki.navigation.title'),
    route: '/developer-wiki'
  });

  return {};
}
