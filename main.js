import { createModuleContext } from './core/module-api/createModuleContext.js';
import { createModuleRegistry } from './core/module-loader/moduleRegistry.js';
import { loadModule } from './core/module-loader/moduleLoader.js';
import { createIanseoRuntime } from './core/adapters/ianseo/runtime/createIanseoRuntime.js';
import leagueManifest from './modules/league/module.manifest.js';
import { mountModule as mountLeagueModule } from './modules/league/module.mount.js';

async function bootstrap() {
  const runtime = await createIanseoRuntime();
  const app = createModuleContext(runtime);
  const registry = createModuleRegistry();

  await loadModule({
    manifest: leagueManifest,
    mountModule: mountLeagueModule,
    app,
    registry
  });

  const leagueVm = app.services.get('league.vm');
  const root = document.getElementById('ffta-app');
  root.innerHTML = `<h1>${app.t('league.title')}</h1><p>${app.t('app.loading')}</p>`;

  try {
    await leagueVm.load();
    root.innerHTML = `<h1>${app.t('league.title')}</h1><pre>${escapeHtml(JSON.stringify(leagueVm.state.standings, null, 2))}</pre>`;
  } catch (error) {
    root.innerHTML = `<h1>${app.t('league.title')}</h1><p>${app.t('league.errors.loadFailed')}</p>`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

bootstrap();
