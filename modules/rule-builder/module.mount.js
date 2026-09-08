import routes from './module.routes.js';
import { createRuleBuilderStore } from './application/ruleBuilder.store.js';
import { createRuleBuilderViewModel } from './application/ruleBuilder.vm.js';
import en from './i18n/en.json' with { type: 'json' };
import fr from './i18n/fr.json' with { type: 'json' };

export async function mountModule(app) {
  app.i18n.registerNamespace('ruleBuilder', { en, fr });

  for (const route of routes) {
    app.routes.register(route);
  }

  app.menu.register({
    id: 'rule-builder',
    label: app.t('ruleBuilder.navigation.title'),
    route: '/rule-builder'
  });

  const store = createRuleBuilderStore();
  const vm = createRuleBuilderViewModel({ app, store });
  app.services.register('rule-builder.vm', vm);
  return { vm };
}
