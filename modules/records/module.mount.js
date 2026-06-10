import routes from './module.routes.js';
import { createRecordsStore } from './application/records.store.js';
import { createRecordsViewModel } from './application/records.vm.js';
import { createIanseoRecordsRepository } from './repositories/ianseo/IanseoRecordsRepository.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('records', { en, fr });

  app.settings.registerSchema('records', {
    defaultAreaCode: { type: 'string', defaultValue: 'FFTA' },
    defaultAreaName: { type: 'string', defaultValue: 'FFTA Records' }
  });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'records',
    label: app.t('records.navigation.title'),
    route: '/records'
  });

  const repository = createIanseoRecordsRepository({ app });
  const store = createRecordsStore();
  const vm = createRecordsViewModel({ app, store, repository });

  app.services.register('records.vm', vm);
  app.services.register('records.repository', repository);

  return { vm };
}
