import '../../core/ui/styles/tokens.css';
import '../../core/ui/styles/foundation.css';
import '../../core/ui/styles/utilities.css';
import './lab.css';

import { createModuleContext } from '../../core/module-api/createModuleContext.js';
import { createModuleRegistry } from '../../core/module-loader/moduleRegistry.js';
import { loadModule } from '../../core/module-loader/moduleLoader.js';
import { validateModuleManifest } from '../../core/module-loader/moduleValidator.js';
import { createMockIanseoRuntime } from './mockIanseoRuntime.js';

import coreEn from '../../core/i18n/en.json' with { type: 'json' };
import coreFr from '../../core/i18n/fr.json' with { type: 'json' };


const labManifestLoaders = import.meta.glob([
  '../../modules/*/module.manifest.js',
  '../../examples/*/module.manifest.js'
]);
const labEntryLoaders = import.meta.glob([
  '../../modules/*/module.mount.js',
  '../../examples/*/module.mount.js'
]);
const labRouteLoaders = import.meta.glob([
  '../../modules/*/module.routes.js',
  '../../examples/*/module.routes.js'
]);
const labSimplePageLoaders = import.meta.glob([
  '../../modules/*/index.js',
  '../../examples/*/index.js'
]);
const labPageLoaders = import.meta.glob([
  '../../modules/*/ui/pages/*.js',
  '../../examples/*/ui/pages/*.js'
]);
const labI18nLoaders = import.meta.glob([
  '../../modules/*/i18n/*.json',
  '../../examples/*/i18n/*.json'
]);

const root = document.getElementById('ffta-lab');
const CERTIFICATION_KEY = 'fftaLab.certification.v1';

bootstrapLab().catch((error) => {
  console.error('[ffta-lab] Bootstrap failed', error);
  if (root) {
    root.innerHTML = `<main class="ffta-lab__workspace"><pre>${escapeHtml(String(error?.stack || error))}</pre></main>`;
  }
});

async function bootstrapLab() {
  if (!root) return;

  const runtime = createMockIanseoRuntime({ baseUrl: new URL('../', import.meta.url).href });
  const app = createModuleContext(runtime);
  installLabDevHooks(app);
  const registry = createModuleRegistry();
  const discoveredModules = getDiscoveredModules();
  const manifestsById = await loadDiscoveredManifests(discoveredModules);
  const labState = runtime.lab.state.get();
  applyLabShellState(labState);
  const moduleIds = discoveredModules.map((moduleDefinition) => moduleDefinition.id).filter((id) => manifestsById.has(id));
  let activeModuleId = getInitialModuleId(moduleIds);
  const loadedPages = new Map();
  const validationById = new Map();

  app.i18n.registerNamespace('app', { en: coreEn, fr: coreFr });

  for (const moduleDefinition of discoveredModules) {
    const manifest = manifestsById.get(moduleDefinition.id);
    if (!manifest) continue;

    validationById.set(manifest.id, buildValidationReport({ manifest, moduleDefinition, app }));

    const access = await app.acl.getAccess(manifest);
    if (access === 'none') continue;

    try {
      const loaded = await loadLabModule({ app, registry, manifest, moduleDefinition });
      if (loaded?.mountPage) loadedPages.set(manifest.id, loaded.mountPage);
    } catch (error) {
      console.error(`[ffta-lab] Module failed: ${manifest.id}`, error);
      validationById.set(manifest.id, appendValidationError(validationById.get(manifest.id), error));
    }
  }

  renderLab({ app, runtime, manifestsById, moduleIds, activeModuleId, loadedPages, validationById, labState });
}


function installLabDevHooks(app) {
  if (!app?.dev?.enabled) return;
  app.logger.info('Lab dev mode enabled', app.dev.config, 'runtime');
  if (app.dev.shouldExposeGlobal()) {
    window.__FFTA_APP__ = app;
    window.__FFTA_DEV__ = app.dev.config;
    app.logger.info('Global debug handles exposed: window.__FFTA_APP__, window.__FFTA_DEV__', null, 'runtime');
  }
}

function renderLab(context) {
  const { app, runtime, manifestsById, moduleIds, activeModuleId, loadedPages, validationById } = context;
  const state = runtime.lab.state.get();
  const manifest = manifestsById.get(activeModuleId) || manifestsById.get(moduleIds[0]);
  const activeId = manifest?.id || moduleIds[0] || '';
  const access = app.acl.getCachedAccess(activeId);
  const aclProfiles = runtime.lab.aclProfiles;
  const certification = buildCertificationReport({
    manifest,
    moduleDefinition: { id: activeId },
    validationItems: validationById.get(activeId) || [],
    runtime,
    app
  });
  const lastCertification = readStoredCertification(activeId);

  root.innerHTML = `
    <div class="ffta-lab">
      <aside class="ffta-lab__panel">
        <div class="ffta-lab__brand">
          <h1>FFTA Modules Lab</h1>
          <p>Local Ianseo simulator for module development, ACL checks and mock data validation.</p>
        </div>

        <section class="ffta-lab__section">
          <h2>Runtime</h2>
          <p>Tournament: <strong>${escapeHtml(runtime.lab.getDataSnapshot().tournament.code)}</strong></p>
          <div class="ffta-lab__field">
            <label for="lab-module">Module</label>
            <select id="lab-module" data-lab-control="module">
              ${moduleIds.map((id) => `<option value="${escapeAttribute(id)}" ${id === activeId ? 'selected' : ''}>${escapeHtml(id)}</option>`).join('')}
            </select>
          </div>
          <div class="ffta-lab__field">
            <label for="lab-acl-profile">ACL profile</label>
            <select id="lab-acl-profile" data-lab-control="aclProfile">
              ${Object.entries(aclProfiles).map(([id, profile]) => `<option value="${escapeAttribute(id)}" ${id === state.aclProfile ? 'selected' : ''}>${escapeHtml(profile.label || id)}</option>`).join('')}
            </select>
          </div>
          <div class="ffta-lab__field">
            <label for="lab-language">Language</label>
            <select id="lab-language" data-lab-control="language">
              <option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option>
              <option value="fr" ${state.language === 'fr' ? 'selected' : ''}>Français</option>
            </select>
          </div>
          <div class="ffta-lab__field">
            <label for="lab-data-scenario">Data scenario</label>
            <select id="lab-data-scenario" data-lab-control="dataScenario">
              ${Object.entries(runtime.lab.scenarios).map(([id, scenario]) => `<option value="${escapeAttribute(id)}" ${id === state.dataScenario ? 'selected' : ''}>${escapeHtml(scenario.label || id)}</option>`).join('')}
            </select>
          </div>
          ${buildFakeCompetitionGenerator(runtime)}
          <div class="ffta-lab__field ffta-lab__field--inline">
            <label for="lab-dev-mode">Dev mode</label>
            <input id="lab-dev-mode" type="checkbox" data-lab-control="devMode" ${state.devMode ? 'checked' : ''}>
          </div>
          <div class="ffta-lab__field">
            <label for="lab-api-mode">API mode</label>
            <select id="lab-api-mode" data-lab-control="apiMode">
              ${['normal', 'slow', 'error', 'random-error', 'offline'].map((mode) => `<option value="${mode}" ${mode === state.apiMode ? 'selected' : ''}>${mode}</option>`).join('')}
            </select>
          </div>
          <div class="ffta-lab__field">
            <label for="lab-theme">Theme</label>
            <select id="lab-theme" data-lab-control="theme">
              <option value="light" ${state.theme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${state.theme === 'dark' ? 'selected' : ''}>Dark</option>
            </select>
          </div>
          <div class="ffta-lab__field">
            <label for="lab-viewport">Device frame</label>
            <select id="lab-viewport" data-lab-control="viewport">
              <option value="desktop" ${state.viewport === 'desktop' ? 'selected' : ''}>Desktop</option>
              <option value="tablet" ${state.viewport === 'tablet' ? 'selected' : ''}>Tablet</option>
              <option value="mobile" ${state.viewport === 'mobile' ? 'selected' : ''}>Mobile</option>
            </select>
          </div>
          <div class="ffta-lab__button-row">
            <button type="button" class="ffta-lab__button" data-lab-action="reload">Reload lab</button>
            <button type="button" class="ffta-lab__button ffta-lab__button--ghost" data-lab-action="resetData">Reset data</button>
          </div>
        </section>

        <section class="ffta-lab__section">
          <h2>Module certification</h2>
          ${buildCertificationSummary(certification, lastCertification)}
          ${buildCertificationList(certification.items)}
          <div class="ffta-lab__button-row">
            <button type="button" class="ffta-lab__button" data-lab-action="runCertification">Run certification</button>
          </div>
        </section>

        <section class="ffta-lab__section">
          <h2>Templates</h2>
          <p>Starter files are available in <code>lab/templates</code>: simple read-only, simple read/write, export helper and MVVM advanced.</p>
        </section>

        <section class="ffta-lab__section">
          <h2>Mock data snapshot</h2>
          <pre class="ffta-lab__data-preview">${escapeHtml(JSON.stringify(runtime.lab.getDataSnapshot(), null, 2))}</pre>
        </section>
      </aside>

      <main class="ffta-lab__content">
        <header class="ffta-lab__topbar">
          <div>
            <h2>${escapeHtml(manifest?.name || activeId || 'No module')}</h2>
            <p>${escapeHtml(manifest?.description || 'Select a module to test it inside the simulated Ianseo host.')}</p>
          </div>
          <div class="ffta-lab__badges">
            <span class="ffta-lab__badge ${access === 'write' ? 'ffta-lab__badge--good' : access === 'read' ? 'ffta-lab__badge--warn' : 'ffta-lab__badge--bad'}">ACL ${escapeHtml(access.toUpperCase())}</span>
            <span class="ffta-lab__badge">Runtime ${escapeHtml(app.runtime.type)} / lab</span>
            <span class="ffta-lab__badge ${certification.status === 'certified' ? 'ffta-lab__badge--good' : certification.status === 'warning' ? 'ffta-lab__badge--warn' : 'ffta-lab__badge--bad'}">${escapeHtml(certification.label)}</span>
            ${app.dev.enabled ? '<span class="ffta-lab__badge ffta-lab__badge--warn">DEV MODE</span>' : ''}
            <span class="ffta-lab__badge">SDK ${escapeHtml(manifest?.sdkVersion || 'n/a')}</span>
          </div>
        </header>
        <div class="ffta-lab__workspace">
          <section class="ffta-modules-shell ffta-lab__host ffta-lab__host--${escapeAttribute(state.viewport)}">
            <main id="ffta-lab-outlet" class="ffta-app"></main>
          </section>
        </div>
      </main>
    </div>
  `;

  wireLabControls({ runtime, activeId });
  mountActiveModule({ app, loadedPages, activeId });
}

function wireLabControls({ runtime, activeId }) {
  root.querySelector('[data-lab-control="module"]')?.addEventListener('change', (event) => {
    const nextModule = event.target.value;
    const url = new URL(window.location.href);
    url.searchParams.set('module', nextModule);
    window.history.replaceState({}, '', url);
    window.location.reload();
  });

  root.querySelector('[data-lab-control="aclProfile"]')?.addEventListener('change', (event) => {
    runtime.lab.state.set({ aclProfile: event.target.value });
    window.location.reload();
  });

  root.querySelector('[data-lab-control="language"]')?.addEventListener('change', (event) => {
    runtime.lab.state.set({ language: event.target.value });
    window.location.reload();
  });

  root.querySelector('[data-lab-control="dataScenario"]')?.addEventListener('change', (event) => {
    runtime.lab.reloadScenario(event.target.value);
    window.location.reload();
  });

  root.querySelector('[data-lab-control="devMode"]')?.addEventListener('change', (event) => {
    runtime.lab.state.set({ devMode: Boolean(event.target.checked) });
    window.location.reload();
  });

  root.querySelector('[data-lab-control="apiMode"]')?.addEventListener('change', (event) => {
    runtime.lab.state.set({ apiMode: event.target.value });
  });

  root.querySelector('[data-lab-control="theme"]')?.addEventListener('change', (event) => {
    runtime.lab.state.set({ theme: event.target.value });
    applyLabShellState(runtime.lab.state.get());
  });

  root.querySelector('[data-lab-control="viewport"]')?.addEventListener('change', (event) => {
    runtime.lab.state.set({ viewport: event.target.value });
    window.location.reload();
  });

  root.querySelector('[data-lab-action="reload"]')?.addEventListener('click', () => window.location.reload());
  root.querySelector('[data-lab-action="resetData"]')?.addEventListener('click', () => {
    runtime.lab.resetData();
    const url = new URL(window.location.href);
    url.searchParams.set('module', activeId);
    window.history.replaceState({}, '', url);
    window.location.reload();
  });

  root.querySelector('[data-lab-action="generateCompetition"]')?.addEventListener('click', () => {
    const form = root.querySelector('[data-lab-generator]');
    const options = {
      entries: form?.querySelector('[name="entries"]')?.value,
      sessions: form?.querySelector('[name="sessions"]')?.value,
      archersPerTarget: form?.querySelector('[name="archersPerTarget"]')?.value,
      seed: form?.querySelector('[name="seed"]')?.value
    };
    runtime.lab.generateCompetition(options);
    const url = new URL(window.location.href);
    url.searchParams.set('module', activeId);
    window.history.replaceState({}, '', url);
    window.location.reload();
  });

  root.querySelector('[data-lab-action="runCertification"]')?.addEventListener('click', () => {
    const report = root.querySelector('[data-lab-certification-report]');
    const payload = {
      moduleId: activeId,
      checkedAt: new Date().toISOString(),
      status: report?.dataset.status || 'unknown',
      score: report?.dataset.score || '0'
    };
    localStorage.setItem(`${CERTIFICATION_KEY}.${activeId}`, JSON.stringify(payload));
    window.location.reload();
  });
}

function mountActiveModule({ app, loadedPages, activeId }) {
  const outlet = root.querySelector('#ffta-lab-outlet');
  if (!outlet) return;

  const mountPage = loadedPages.get(activeId);
  if (!mountPage) {
    outlet.innerHTML = `<section class="ffta-page"><h1>Module not mounted</h1><p class="ffta-muted">The module is hidden by ACL, has validation errors, or does not expose a page route.</p></section>`;
    return;
  }

  const vm = resolveViewModel({ app, moduleId: activeId });
  mountPage({ root: outlet, app, vm });
}

function resolveViewModel({ app, moduleId }) {
  const candidates = [`${moduleId}.vm`, moduleId === 'export-ffta' ? 'export-ffta.vm' : '', moduleId === 'league' ? 'league.vm' : ''].filter(Boolean);
  for (const id of candidates) {
    try {
      return app.services.get(id);
    } catch {}
  }
  return null;
}

function getDiscoveredModules() {
  return (Array.isArray(window.__FFTA_MODULES__) ? window.__FFTA_MODULES__ : [])
    .filter((moduleDefinition) => moduleDefinition?.id && moduleDefinition?.manifestPath)
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
}

async function loadDiscoveredManifests(discoveredModules) {
  const manifestsById = new Map();
  for (const moduleDefinition of discoveredModules) {
    try {
      const manifestPath = normalizeLabModulePath(moduleDefinition.manifestPath || `../../modules/${moduleDefinition.id}/module.manifest.js`);
      const manifestLoader = labManifestLoaders[manifestPath];
      if (!manifestLoader) throw new Error(`Manifest is not exposed to the Lab bundler: ${manifestPath}`);
      const manifestModule = await manifestLoader();
      const manifest = manifestModule.default;
      if (!manifest?.id) throw new Error(`Invalid manifest: ${moduleDefinition.manifestPath}`);
      moduleDefinition.labManifestPath = manifestPath;
      moduleDefinition.labBasePath = normalizeLabBasePath(moduleDefinition.basePath || inferBasePathFromManifestPath(manifestPath));
      manifestsById.set(manifest.id, manifest);
    } catch (error) {
      console.error(`[ffta-lab] Manifest failed: ${moduleDefinition.id}`, error);
    }
  }
  return manifestsById;
}

async function loadLabModule({ app, registry, manifest, moduleDefinition }) {
  const moduleBasePath = normalizeLabBasePath(moduleDefinition.labBasePath || moduleDefinition.basePath || `../../modules/${manifest.id}/`);

  if ((manifest.type || 'mvvm') === 'simple') {
    await loadManifestI18n({ app, manifest, moduleBasePath });
    registerSimpleModule({ app, manifest });
    const customPage = await resolveSimplePageMount({ manifest, moduleBasePath });
    return { manifest, mountPage: customPage || createSimpleModuleMountPage({ manifest }) };
  }

  await loadManifestI18n({ app, manifest, moduleBasePath });
  const entryPath = toLabModuleFile(moduleBasePath, manifest.entry || './module.mount.js');
  const entryLoader = labEntryLoaders[entryPath];
  if (!entryLoader) throw new Error(`Entry is not exposed to the Lab bundler: ${entryPath}`);
  const entryModule = await entryLoader();
  await loadModule({ manifest, mountModule: entryModule.mountModule, app, registry });
  return { manifest, mountPage: await resolvePageMount({ manifest, moduleBasePath }) };
}

async function loadManifestI18n({ app, manifest, moduleBasePath }) {
  const files = Array.isArray(manifest.i18n) ? manifest.i18n : [];
  const translations = {};
  for (const file of files) {
    const i18nPath = toLabModuleFile(moduleBasePath, file);
    const i18nLoader = labI18nLoaders[i18nPath];
    if (!i18nLoader) continue;
    const language = String(file).includes('/fr') || String(file).endsWith('fr.json') ? 'fr' : 'en';
    const i18nModule = await i18nLoader();
    translations[language] = i18nModule.default || i18nModule;
  }
  if (Object.keys(translations).length) app.i18n.registerNamespace(manifest.id, translations);
}

function registerSimpleModule({ app, manifest }) {
  app.menu.register({
    id: manifest.id,
    label: app.t(manifest.page?.titleKey || `${manifest.id}.title`),
    route: `/${manifest.id}`
  });
}

function createSimpleModuleMountPage({ manifest }) {
  return function mountSimpleModulePage({ root: pageRoot, app }) {
    let lastResult = null;

    async function runAction(action) {
      const permission = action.permission || 'read';
      const access = app.acl.getCachedAccess(manifest.id);
      if (permission === 'write' && access !== 'write') {
        app.notify.error(app.t('app.acl.writeDenied'));
        return;
      }

      try {
        const handler = action.handler || {};
        const service = app.data?.[handler.service];
        if (!service || typeof service[handler.method] !== 'function') {
          throw new Error(`Unknown simple action handler: ${handler.service}.${handler.method}`);
        }
        lastResult = await service[handler.method](handler.payload || {}, { moduleId: manifest.id, permission });
        render();
      } catch (error) {
        app.notify.error(error.message || app.t('app.simple.actionFailed'));
      }
    }

    function render() {
      const title = app.t(manifest.page?.titleKey || `${manifest.id}.title`);
      const description = app.t(manifest.page?.descriptionKey || `${manifest.id}.description`);
      const access = app.acl.getCachedAccess(manifest.id);
      const actions = Array.isArray(manifest.page?.actions) ? manifest.page.actions : [];
      pageRoot.innerHTML = `
        <section class="ffta-page ffta-simple-page">
          <div class="ffta-page__header">
            <div>
              <h1>${escapeHtml(title)}</h1>
              <p class="ffta-muted">${escapeHtml(description)}</p>
            </div>
            <span class="ffta-badge">${escapeHtml(access.toUpperCase())}</span>
          </div>
          <article class="cp-card">
            <div class="ffta-simple-actions">
              ${actions.map((action) => buildSimpleActionButton({ action, app, access })).join('')}
            </div>
            ${lastResult ? renderSimpleResult(lastResult, app) : ''}
          </article>
        </section>
      `;
    }

    function handleClick(event) {
      const actionId = event.target.closest('[data-simple-action]')?.dataset.simpleAction;
      if (!actionId) return;
      const action = (manifest.page?.actions || []).find((item) => item.id === actionId);
      if (action) runAction(action);
    }

    pageRoot.addEventListener('click', handleClick);
    render();
    return () => pageRoot.removeEventListener('click', handleClick);
  };
}



async function resolveSimplePageMount({ manifest, moduleBasePath }) {
  const indexPath = manifest.page?.index;
  if (!indexPath) return null;
  const pagePath = toLabModuleFile(moduleBasePath, indexPath);
  const pageLoader = labSimplePageLoaders[pagePath];
  if (!pageLoader) throw new Error(`Simple page is not exposed to the Lab bundler: ${pagePath}`);
  const pageModule = await pageLoader();
  const mountPage = pageModule.mountSimpleModulePage || pageModule.default;
  if (typeof mountPage !== 'function') {
    throw new Error(`Simple page ${pagePath} must export mountSimpleModulePage() or default.`);
  }
  return function mountResolvedSimplePage({ root, app }) {
    return mountPage({ root, app, manifest });
  };
}

function renderSimpleResult(result, app) {
  if (Array.isArray(result) && result.length && typeof result[0] === 'object') {
    const columns = Object.keys(result[0]).slice(0, 8).map((key) => ({ key, label: key }));
    return app.ui.renderTable({ columns, rows: result });
  }
  return `<pre class="ffta-simple-result">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
}

function buildSimpleActionButton({ action, app, access }) {
  const requiresWrite = (action.permission || 'read') === 'write';
  const disabled = requiresWrite && access !== 'write';
  return `<button type="button" class="cp-button ${requiresWrite ? 'cp-button--primary' : ''}" data-simple-action="${escapeAttribute(action.id)}" ${disabled ? 'disabled' : ''}>${escapeHtml(app.t(action.labelKey || action.id))}</button>`;
}

async function resolvePageMount({ manifest, moduleBasePath }) {
  const routesPath = toLabModuleFile(moduleBasePath, manifest.routes || './module.routes.js');
  const routesLoader = labRouteLoaders[routesPath];
  if (!routesLoader) throw new Error(`Routes are not exposed to the Lab bundler: ${routesPath}`);
  const routesModule = await routesLoader();
  const routes = Array.isArray(routesModule.default) ? routesModule.default : [];
  const firstPageRoute = routes.find((route) => route?.component);
  if (!firstPageRoute) return null;

  const componentName = firstPageRoute.component;
  const pagePath = toLabModuleFile(moduleBasePath, `./ui/pages/${componentName}.js`);
  const pageLoader = labPageLoaders[pagePath];
  if (!pageLoader) throw new Error(`Page is not exposed to the Lab bundler: ${pagePath}`);
  const pageModule = await pageLoader();
  const expectedExportName = `mount${componentName}`;
  return pageModule[expectedExportName] || pageModule.default || null;
}

function normalizeLabModulePath(path) {
  return String(path || '')
    .replace(/\\/g, '/')
    .replace(/^\.\.\/modules\//, '../../modules/')
    .replace(/^\.\.\/examples\//, '../../examples/')
    .replace(/^\.\/modules\//, '../../modules/')
    .replace(/^\.\/examples\//, '../../examples/');
}

function normalizeLabBasePath(path) {
  const normalized = normalizeLabModulePath(path || '');
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function inferBasePathFromManifestPath(manifestPath) {
  return String(manifestPath).replace(/module\.manifest\.js$/, '');
}

function toLabModuleFile(basePath, relativePath) {
  const base = normalizeLabBasePath(basePath);
  const relative = String(relativePath || '').replace(/^\.\//, '');
  return normalizeLabModulePath(`${base}${relative}`);
}


function buildFakeCompetitionGenerator(runtime) {
  const snapshot = runtime.lab.getDataSnapshot();
  const options = snapshot?.tournament?.generatedOptions || { entries: 48, sessions: 2, archersPerTarget: 4, seed: 2026 };
  return `
    <div class="ffta-lab__generator" data-lab-generator>
      <h3>Fake competition generator</h3>
      <div class="ffta-lab__grid-2">
        <label>Archers <input name="entries" type="number" min="1" max="2000" value="${escapeAttribute(options.entries || 48)}"></label>
        <label>Sessions <input name="sessions" type="number" min="1" max="8" value="${escapeAttribute(options.sessions || 2)}"></label>
        <label>Archers / target <input name="archersPerTarget" type="number" min="1" max="4" value="${escapeAttribute(options.archersPerTarget || 4)}"></label>
        <label>Seed <input name="seed" type="number" min="1" max="999999" value="${escapeAttribute(options.seed || 2026)}"></label>
      </div>
      <div class="ffta-lab__button-row">
        <button type="button" class="ffta-lab__button ffta-lab__button--ghost" data-lab-action="generateCompetition">Generate mock competition</button>
      </div>
      <p>${escapeHtml(snapshot.entries.length)} entries / ${escapeHtml(snapshot.qualificationScores.length)} score rows currently loaded.</p>
    </div>
  `;
}

function buildCertificationReport({ manifest, moduleDefinition, validationItems = [], runtime, app }) {
  const items = [];
  const validationErrors = validationItems.filter((item) => item.level === 'error');
  const validationWarnings = validationItems.filter((item) => item.level === 'warn');

  items.push(validationErrors.length
    ? { level: 'error', message: `${validationErrors.length} validation error(s) must be fixed before certification.` }
    : { level: 'ok', message: 'Manifest validation has no blocking error.' });

  if (validationWarnings.length) {
    items.push({ level: 'warn', message: `${validationWarnings.length} validation warning(s) should be reviewed.` });
  }

  if (manifest?.sdkVersion) items.push({ level: 'ok', message: `SDK compatibility declared: ${manifest.sdkVersion}.` });
  else items.push({ level: 'warn', message: 'SDK compatibility is not declared.' });

  if (manifest?.author || manifest?.license || manifest?.website) {
    items.push({ level: 'ok', message: 'Marketplace metadata is partially declared.' });
  } else {
    items.push({ level: 'warn', message: 'Marketplace metadata is missing: author, license or website.' });
  }

  if (manifest?.access?.subFeature) items.push({ level: 'ok', message: 'ACL subFeature is declared.' });
  else items.push({ level: 'error', message: 'ACL subFeature is missing; access cannot be certified.' });

  const aclCoverage = Object.entries(runtime.lab.aclProfiles || {}).every(([, profile]) => (
    profile.defaultAccess || Object.prototype.hasOwnProperty.call(profile.modules || {}, manifest?.id)
  ));
  items.push(aclCoverage
    ? { level: 'ok', message: 'All Lab ACL profiles can resolve this module access.' }
    : { level: 'warn', message: 'At least one Lab ACL profile relies on an implicit fallback.' });

  const i18nFiles = Array.isArray(manifest?.i18n) ? manifest.i18n : [];
  const hasEnglish = i18nFiles.some((file) => String(file).includes('/en') || String(file).endsWith('en.json'));
  const hasFrench = i18nFiles.some((file) => String(file).includes('/fr') || String(file).endsWith('fr.json'));
  items.push(hasEnglish && hasFrench
    ? { level: 'ok', message: 'English and French i18n files are declared.' }
    : { level: 'warn', message: 'English/French i18n coverage is incomplete.' });

  const actions = Array.isArray(manifest?.page?.actions) ? manifest.page.actions : [];
  const writeActions = actions.filter((action) => (action.permission || 'read') === 'write');
  const unsafeWriteActions = actions.filter((action) => String(action.handler?.method || '').toLowerCase().includes('write') && (action.permission || 'read') !== 'write');
  if (unsafeWriteActions.length) {
    items.push({ level: 'error', message: `${unsafeWriteActions.length} action(s) call a write-like method without write permission.` });
  } else if (writeActions.length) {
    items.push({ level: 'ok', message: 'Write actions explicitly require write permission.' });
  } else {
    items.push({ level: 'ok', message: 'No write action detected.' });
  }

  const snapshot = runtime.lab.getDataSnapshot();
  items.push(snapshot?.tournament?.code
    ? { level: 'ok', message: `Lab tournament context available: ${snapshot.tournament.code}.` }
    : { level: 'error', message: 'No Lab tournament context is available.' });
  items.push(Array.isArray(snapshot?.entries)
    ? { level: 'ok', message: `Lab entries dataset available: ${snapshot.entries.length} row(s).` }
    : { level: 'error', message: 'Lab entries dataset is missing.' });
  items.push(Array.isArray(snapshot?.qualificationScores)
    ? { level: 'ok', message: `Lab qualification scores dataset available: ${snapshot.qualificationScores.length} row(s).` }
    : { level: 'error', message: 'Lab qualification scores dataset is missing.' });

  const errorCount = items.filter((item) => item.level === 'error').length;
  const warnCount = items.filter((item) => item.level === 'warn').length;
  const okCount = items.filter((item) => item.level === 'ok').length;
  const score = Math.round((okCount / Math.max(1, items.length)) * 100);
  const status = errorCount ? 'failed' : warnCount ? 'warning' : 'certified';
  const label = status === 'certified' ? 'Certified' : status === 'warning' ? 'Certified with warnings' : 'Certification failed';
  return { status, label, score, okCount, warnCount, errorCount, items, moduleId: manifest?.id || moduleDefinition?.id || '' };
}

function buildCertificationSummary(certification, lastCertification) {
  return `
    <div class="ffta-lab__certification ffta-lab__certification--${escapeAttribute(certification.status)}" data-lab-certification-report data-status="${escapeAttribute(certification.status)}" data-score="${escapeAttribute(certification.score)}">
      <strong>${escapeHtml(certification.label)}</strong>
      <span>${escapeHtml(certification.score)}% · ${escapeHtml(certification.okCount)} ok · ${escapeHtml(certification.warnCount)} warnings · ${escapeHtml(certification.errorCount)} errors</span>
      ${lastCertification?.checkedAt ? `<small>Last run: ${escapeHtml(new Date(lastCertification.checkedAt).toLocaleString())}</small>` : '<small>Not run yet in this browser session.</small>'}
    </div>
  `;
}

function buildCertificationList(items = []) {
  if (!items.length) return '<p>No certification data available.</p>';
  return `<div class="ffta-lab__validation-list">${items.map((item) => `
    <div class="ffta-lab__validation-item ffta-lab__validation-item--${escapeAttribute(item.level)}">
      <span class="ffta-lab__validation-icon">${item.level === 'ok' ? '✓' : item.level === 'warn' ? '!' : '×'}</span>
      <span>${escapeHtml(item.message)}</span>
    </div>`).join('')}</div>`;
}

function readStoredCertification(moduleId) {
  try {
    const raw = localStorage.getItem(`${CERTIFICATION_KEY}.${moduleId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildValidationReport({ manifest, moduleDefinition, app = null }) {
  const baseValidation = app?.validation?.validateManifest(manifest) || validateModuleManifest(manifest);
  const items = [];
  items.push(baseValidation.ok
    ? { level: 'ok', message: 'Manifest required fields are valid.' }
    : { level: 'error', message: (baseValidation.errors || baseValidation.items?.filter((item) => item.level === 'error').map((item) => item.message) || []).join(' ') });
  if (Array.isArray(baseValidation.items)) items.push(...baseValidation.items.filter((item) => item.level !== 'error'));

  if (manifest.id !== moduleDefinition.id) {
    items.push({ level: 'warn', message: `Manifest id (${manifest.id}) differs from discovery id (${moduleDefinition.id}).` });
  } else {
    items.push({ level: 'ok', message: 'Discovery id matches manifest id.' });
  }

  if (manifest.access?.subFeature) {
    items.push({ level: 'ok', message: `ACL subFeature configured: ${manifest.access.subFeature}.` });
  } else {
    items.push({ level: 'warn', message: 'No ACL subFeature configured; module may rely on fallback access.' });
  }

  if ((manifest.type || 'mvvm') === 'simple') {
    const actions = Array.isArray(manifest.page?.actions) ? manifest.page.actions : [];
    items.push(actions.length
      ? { level: 'ok', message: `Simple module declares ${actions.length} action(s).` }
      : { level: 'warn', message: 'Simple module has no page actions.' });
    const invalidAction = actions.find((action) => !action.handler?.service || !action.handler?.method);
    if (invalidAction) {
      items.push({ level: 'error', message: `Simple action ${invalidAction.id || '(unknown)'} has no service/method handler.` });
    }
  }

  return items;
}

function appendValidationError(report = [], error) {
  return [...report, { level: 'error', message: error.message || String(error) }];
}

function buildValidationList(items = []) {
  if (!items.length) return '<p>No validation data available.</p>';
  return `<div class="ffta-lab__validation-list">${items.map((item) => `
    <div class="ffta-lab__validation-item ffta-lab__validation-item--${escapeAttribute(item.level)}">
      <span class="ffta-lab__validation-icon">${item.level === 'ok' ? '✓' : item.level === 'warn' ? '!' : '×'}</span>
      <span>${escapeHtml(item.message)}</span>
    </div>`).join('')}</div>`;
}


function applyLabShellState(state) {
  document.documentElement.dataset.labTheme = state.theme || 'light';
  document.documentElement.dataset.labViewport = state.viewport || 'desktop';
}

function getInitialModuleId(moduleIds) {
  const requested = new URL(window.location.href).searchParams.get('module');
  return moduleIds.includes(requested) ? requested : moduleIds[0];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
