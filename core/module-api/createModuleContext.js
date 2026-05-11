import { createSettingsService } from './services/settings.service.js';
import { createI18nService } from './services/i18n.service.js';
import { createNotificationService } from './services/notification.service.js';
import { createRouterService } from './services/router.service.js';
import { createModalService } from './services/modal.service.js';
import { createExportService } from './services/export.service.js';
import { createTournamentService } from './services/tournament.service.js';

export function createModuleContext(runtime) {
  const settings = createSettingsService(runtime.adapters.settings);
  const i18n = createI18nService({ language: runtime.language });

  const app = {
    runtime,
    settings,
    i18n,
    t: (key, params) => i18n.t(key, params),
    routes: createRouterService(),
    menu: createRouterService(),
    notify: createNotificationService(runtime.adapters.notifications),
    modal: createModalService(),
    exports: createExportService(),
    context: createTournamentService(runtime.adapters.tournament),
    services: createServiceRegistry()
  };

  return app;
}

function createServiceRegistry() {
  const services = new Map();
  return {
    register(id, service) {
      services.set(id, service);
    },
    get(id) {
      if (!services.has(id)) {
        throw new Error(`Service not registered: ${id}`);
      }
      return services.get(id);
    }
  };
}
