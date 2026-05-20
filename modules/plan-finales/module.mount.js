import routes from './module.routes.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('plan-finales', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'plan-finales',
    label: app.t('plan-finales.navigation.title'),
    route: '/plan-finales',
    legacy: true
  });

  app.services.register('plan-finales.legacy', {
    id: 'plan-finales',
    title: app.t('plan-finales.title'),
    url: new URL('./modules/plan-finales/legacy/index.php', app.runtime.baseUrl).href,
    openInFrame: true
  });

  return { legacy: true };
}
