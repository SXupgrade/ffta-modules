import routes from './module.routes.js';
import { createAssistantStore } from './application/assistant.store.js';
import { createAssistantViewModel } from './application/assistant.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('assistant', { en, fr });

  for (const route of routes) app.routes.register(route);

  app.menu.register({
    id: 'assistant',
    label: app.t('assistant.navigation.title'),
    route: '/assistant'
  });

  const store = createAssistantStore({ storage: app.runtime?.storage });
  const vm = createAssistantViewModel({ app, store });
  app.services.register('assistant.vm', vm);

  return { vm };
}
