import routes from './module.routes.js';
import { createMinimalStore } from './application/minimal.store.js';
import { createMinimalViewModel } from './application/minimal.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

/**
 * Module entrypoint called by the ffta-modules loader.
 * Keep this file focused on registration and dependency wiring.
 *
 * @param {Object} app Public Module API context.
 * @returns {Promise<{vm: Object}>}
 */
export async function mountModule(app) {
  app.i18n.registerNamespace('minimal', { en, fr });

  app.settings.registerSchema('minimal-module', {
    greeting: { type: 'string', defaultValue: 'Hello from Minimal Module' }
  });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'minimal-module',
    label: app.t('minimal.navigation.title'),
    route: '/minimal-module'
  });

  const store = createMinimalStore();
  const vm = createMinimalViewModel({ app, store });

  app.services.register('minimal-module.vm', vm);

  return { vm };
}
