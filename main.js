import { createModuleContext } from './core/module-api/createModuleContext.js';
import { createModuleRegistry } from './core/module-loader/moduleRegistry.js';
import { loadModule } from './core/module-loader/moduleLoader.js';
import { createIanseoRuntime } from './core/adapters/ianseo/runtime/createIanseoRuntime.js';
import leagueManifest from './modules/league/module.manifest.js';
import { mountModule as mountLeagueModule } from './modules/league/module.mount.js';
import { mountLeaguePage } from './modules/league/ui/pages/LeaguePage.js';
import coreEn from './core/i18n/en.json' with { type: 'json' };
import coreFr from './core/i18n/fr.json' with { type: 'json' };

async function bootstrap() {
  const root = document.getElementById('ffta-app');
  if (!root) return;

  root.innerHTML = '<div class="cp-loader"><span class="cp-loader__spinner"></span></div>';

  // Compute an absolute base URL for all PHP API fetch calls.
  // import.meta.url is always the URL of this file on disk, so new URL('./', ...)
  // resolves to the ffta-modules root regardless of how Ianseo routes the page.
  const baseUrl = new URL('./', import.meta.url).href;

  try {
    const runtime  = await createIanseoRuntime({ baseUrl });
    const app      = createModuleContext(runtime);
    const registry = createModuleRegistry();

    app.i18n.registerNamespace('app', { en: coreEn, fr: coreFr });

    await loadModule({
      manifest:    leagueManifest,
      mountModule: mountLeagueModule,
      app,
      registry
    });

    const vm = app.services.get('league.vm');
    mountLeaguePage({ root, vm, app });

  } catch (error) {
    console.error('[ffta] Bootstrap failed', error);
    root.innerHTML = `<div class="ffta-page"><p class="ffta-badge ffta-badge--error">${escapeHtml(String(error))}</p></div>`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

bootstrap();
