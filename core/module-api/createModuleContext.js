import { createSettingsService } from './services/settings.service.js';
import { createI18nService } from './services/i18n.service.js';
import { createNotificationService } from './services/notification.service.js';
import { createRouterService } from './services/router.service.js';
import { createModalService } from './services/modal.service.js';
import { createExportService } from './services/export.service.js';
import { createTournamentService } from './services/tournament.service.js';
import { createAclService } from './services/acl.service.js';
import { createDataService } from './services/data.service.js';
import { createUiService } from './services/ui.service.js';
import { createFilesService } from './services/files.service.js';
import { createValidationService } from './services/validation.service.js';
import { createLoggerService } from './services/logger.service.js';
import { createDevService } from './services/dev.service.js';
import { createIanseoServices } from './services/ianseo/createIanseoServices.js';

export function createModuleContext(runtime) {
  const dev = createDevService(runtime.dev || {});
  const settings = createSettingsService(runtime.adapters.settings);
  const i18n = createI18nService({ language: runtime.language });
  const logger = createLoggerService(runtime.adapters.logger, dev);
  const acl = createAclService(runtime.adapters.acl, dev, logger);

  const data = createDataService(runtime.adapters.data, acl, dev, logger);

  const app = {
    runtime,
    dev,
    settings,
    i18n,
    t: (key, params) => i18n.t(key, params),
    routes: createRouterService(),
    menu: createRouterService(),
    notify: createNotificationService(runtime.adapters.notifications),
    logger,
    modal: createModalService(),
    ui: createUiService(),
    files: createFilesService(),
    exports: createExportService(),
    acl,
    data,
    context: createTournamentService(runtime.adapters.tournament),
    validation: createValidationService(),
    ianseo: createIanseoServices({ data, runtime }),
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
