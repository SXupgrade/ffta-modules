import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('minimal', { en, fr });

  app.settings.registerSchema('minimal-module', {
    greeting: { type: 'string', defaultValue: 'Hello' }
  });

  app.routes.register({
    path: '/minimal-module',
    labelKey: 'minimal.navigation.title',
    component: 'MinimalPage'
  });

  app.menu.register({
    id: 'minimal-module',
    label: app.t('minimal.navigation.title'),
    route: '/minimal-module'
  });

  return {};
}
