import routes from './module.routes.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('prints', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'prints',
    label: app.t('prints.navigation.title'),
    route: '/prints',
    legacy: true
  });

  app.services.register('prints.legacy', {
    id: 'prints',
    title: app.t('prints.title'),
    url: new URL('./modules/prints/legacy/index.php', app.runtime.baseUrl).href,
    openInFrame: true
  });

  return { legacy: true };
}
