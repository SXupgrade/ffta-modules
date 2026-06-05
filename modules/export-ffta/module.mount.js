import routes from './module.routes.js';
import { createExportFftaStore } from './application/exportFfta.store.js';
import { createExportFftaViewModel } from './application/exportFfta.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('exportFfta', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'export-ffta',
    label: app.t('exportFfta.navigation.title'),
    route: '/export-ffta'
  });

  const store = createExportFftaStore();
  const vm = createExportFftaViewModel({ app, store });
  app.services.register('export-ffta.vm', vm);
  return { vm };
}
