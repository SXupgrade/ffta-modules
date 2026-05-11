import en from './i18n/en.json' assert { type: 'json' };
import fr from './i18n/fr.json' assert { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('minimal', { en, fr });
  app.menu.register({
    id: 'minimal-module',
    label: app.t('minimal.title'),
    route: '/minimal-module'
  });
  return {};
}
