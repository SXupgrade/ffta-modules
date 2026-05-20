import routes from './module.routes.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('bslt', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'bslt',
    label: app.t('bslt.navigation.title'),
    route: '/bslt',
    legacy: true
  });

  app.services.register('bslt.legacy', {
    id: 'bslt',
    title: app.t('bslt.title'),
    url: new URL('./modules/bslt/legacy/index.php', app.runtime.baseUrl).href,
    openInFrame: true
  });

  return { legacy: true };
}
