import { createModuleContext } from './core/module-api/createModuleContext.js';
import { createModuleRegistry } from './core/module-loader/moduleRegistry.js';
import { loadModule } from './core/module-loader/moduleLoader.js';
import { createIanseoRuntime } from './core/adapters/ianseo/runtime/createIanseoRuntime.js';

import coreEn from './core/i18n/en.json' with { type: 'json' };
import coreFr from './core/i18n/fr.json' with { type: 'json' };

const FFTA_LOGO_SVG = `
<svg class="ffta-shell__logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 433 99.2" role="img" aria-label="FFTA">
  <style>
    .ffta-logo-st0{fill-rule:evenodd;clip-rule:evenodd;fill:#FFFFFF;}
    .ffta-logo-st1{fill-rule:evenodd;clip-rule:evenodd;fill:#D64031;}
    .ffta-logo-st2{fill:#FFFFFF;}
  </style>
  <g>
    <g>
      <path class="ffta-logo-st0" d="M55.7,33.4c0,0,0,3.5,2.5,3.6c14,0.7,8.4,14.4,8.4,14.4S81.1,33.4,55.7,33.4"/>
      <path class="ffta-logo-st0" d="M62.9,51.4c0,0-20.8-2.2-20.8,2.8c0,3.7,6.4,11.6,6.4,11.6S34,58.6,34,50.2C34,44.2,62.9,51.4,62.9,51.4"/>
      <path class="ffta-logo-st0" d="M113.3,55c0,0,0-3.6-25.2-3.6c-21.6,0-25.2,5.7-18,12.9C70.1,64.4,70.8,53.6,113.3,55"/>
      <path class="ffta-logo-st1" d="M95.2,98.2h1.6c6.4-11.2,13.6-28.5,13.6-43.2C110.5,33.4,94.6,5.7,89,1h-0.9c2.8,3.8,18,22.8,18,54.1C106.1,74.3,100.3,89,95.2,98.2"/>
    </g>
    <g>
      <path class="ffta-logo-st2" d="M151,42.2h-12.4l-2.5,8.9h-3.4l3.4-12.2c0.2-0.6,0.3-1.2,0.5-1.7c0.5-1.6,1.4-3,2.7-4c1.2-1,2.9-1.8,4.4-2.1c1.1-0.2,2.5-0.3,4.2-0.3h6.3l-0.7,2.6h-6.5c-2.1,0-3.2,0.2-4.4,0.9c-1.4,0.8-2.3,2.1-2.9,4.1l-0.3,1.2h12.4L151,42.2"/>
      <path class="ffta-logo-st2" d="M163,34.5h-2.2l4.2-4h3.5L163,34.5 M165.2,44.6h-9.3c-0.4,1.5-0.4,2.4,0.2,3.1c0.2,0.4,0.6,0.6,1,0.7c0.5,0.2,1.6,0.2,2.5,0.2h4.4l-0.7,2.3h-5.3c-2.2,0-3.2-0.2-4.1-0.8c-1.5-1.1-1.9-3.4-1.1-6.2c1.4-5,5-7.7,10.3-7.7h4.4l-0.7,2.3h-4c-2.2,0-3.3,0.3-4.3,1.1c-0.8,0.6-1.4,1.4-2,2.6h9.3L165.2,44.6z"/>
      <path class="ffta-logo-st2" d="M181.4,36.3h-3.5c-3.2,0-5.5,0.8-7.2,2.6c-1.2,1.3-2.3,3.2-2.8,5.1c-0.9,3.3-0.2,5.8,1.8,6.6c0.9,0.4,1.9,0.5,3.7,0.5h6.9l5.7-20.2h-3.1L181.4,36.3 M177.9,48.7h-3.8c-3.1,0-3.9-1.4-2.9-5.1c0.6-2.1,1.5-3.5,2.8-4.2c0.9-0.6,1.9-0.8,3.5-0.8h3.3L177.9,48.7z"/>
      <path class="ffta-logo-st2" d="M195.8,34.5h-2.2l4.2-4h3.5L195.8,34.5 M198,44.6h-9.3c-0.4,1.5-0.4,2.4,0.2,3.1c0.2,0.4,0.6,0.6,1,0.7c0.5,0.2,1.6,0.2,2.5,0.2h4.4l-0.7,2.3h-5.3c-2.2,0-3.2-0.2-4.1-0.8c-1.5-1.1-1.9-3.4-1.1-6.2c1.4-5,5-7.7,10.3-7.7h4.5l-0.7,2.3h-4c-2.2,0-3.3,0.3-4.3,1.1c-0.8,0.6-1.4,1.4-2,2.6h9.3L198,44.6z"/>
      <path class="ffta-logo-st2" d="M207.9,36.3c2.6,0,3.7,0.3,4.4,1.2c0.7,0.8,0.7,1.8,0.1,4.1l-0.4,1.4h-2.9l0.4-1.4c0.6-2.1,0.2-2.8-2-2.8h-1.2L202.9,51h-3.1l4.1-14.7H207.9"/>
      <path class="ffta-logo-st2" d="M225.2,42.1h-5.5c-2.6,0-3.9,0.3-5.1,1.4c-0.9,0.8-1.7,1.9-2,3.2c-0.6,2.1,0.1,3.6,1.7,4.1c1,0.3,1.2,0.3,3.6,0.3h7.8l2.6-9.3c0.6-2.2,0.7-3.2,0.2-4.1c-0.6-1-1.7-1.4-4.5-1.4h-7.9l-0.7,2.3h7.3c3,0,3.3,0.5,2.6,3.1L225.2,42.1 M224.6,44.4l-1.2,4.3h-5.1c-2.2,0-2.9-0.6-2.5-2.1c0.5-1.6,1.4-2.2,3.7-2.2H224.6z"/>
      <path class="ffta-logo-st2" d="M236.9,30.8h3.1l-1.5,5.5h4.5l-0.7,2.3h-4.5l-2.2,7.8c-0.3,1.2-0.4,1.6-0.1,1.9c0.3,0.3,0.8,0.4,2.1,0.4h1.8l-0.7,2.3h-3c-2,0-2.7-0.2-3.3-0.9c-0.3-0.3-0.4-0.7-0.5-1.1c0-0.5,0.2-1.6,0.4-2.5l2.2-8h-3l0.7-2.3h3L236.9,30.8"/>
      <path class="ffta-logo-st2" d="M247.6,30.8h3.1l-0.9,3.1h-3.1L247.6,30.8 M249.1,36.3L245,51h-3.1l4.1-14.7H249.1z"/>
      <path class="ffta-logo-st2" d="M250.3,44c-1.3,4.6,0.8,7.2,5.9,7.2c5,0,8.7-2.8,10-7.4c1.4-4.9-0.6-7.6-5.6-7.6C255.4,36.1,251.7,39,250.3,44 M253.5,43.8c1-3.4,3.1-5.2,6.2-5.2c3,0,4.2,1.9,3.3,5.2c-0.9,3.3-3,5-6.2,5C253.7,48.8,252.6,47.1,253.5,43.8z"/>
      <path class="ffta-logo-st2" d="M278.7,36.3c4.5,0,5.8,1.6,4.6,6l-2.5,8.8h-3.1l2.4-8.5c0.8-2.9,0.2-3.9-2.6-3.9H274L270.5,51h-3.1l4.1-14.7H278.7"/>
      <path class="ffta-logo-st2" d="M311,42.2h-12.4l-2.5,8.9h-3.4l3.4-12.2c0.2-0.6,0.3-1.2,0.5-1.7c0.5-1.6,1.4-3,2.7-4c1.2-1,2.9-1.8,4.4-2.1c1.1-0.2,2.5-0.3,4.2-0.3h6.3l-0.7,2.6H307c-2.1,0-3.2,0.2-4.4,0.9c-1.4,0.8-2.3,2.1-2.9,4.1l-0.3,1.2h12.4L311,42.2"/>
      <path class="ffta-logo-st2" d="M319.5,36.3c2.6,0,3.7,0.3,4.4,1.2c0.7,0.8,0.7,1.8,0.1,4.1l-0.4,1.4h-2.9l0.4-1.4c0.6-2.1,0.2-2.8-2-2.8h-1.2L314.4,51h-3.1l4.1-14.7H319.5"/>
      <path class="ffta-logo-st2" d="M336.8,42.1h-5.5c-2.6,0-3.9,0.3-5.1,1.4c-0.9,0.8-1.7,1.9-2,3.2c-0.6,2.1,0.1,3.6,1.7,4.1c1,0.3,1.2,0.3,3.6,0.3h7.8l2.6-9.3c0.6-2.2,0.7-3.2,0.2-4.1c-0.6-1-1.7-1.4-4.5-1.4h-7.9l-0.7,2.3h7.3c3,0,3.3,0.5,2.6,3.1L336.8,42.1 M336.1,44.4l-1.2,4.3h-5.1c-2.2,0-2.9-0.6-2.5-2.1c0.5-1.6,1.4-2.2,3.7-2.2H336.1z"/>
      <path class="ffta-logo-st2" d="M352.8,36.3c4.5,0,5.8,1.6,4.6,6l-2.5,8.8h-3.1l2.4-8.5c0.8-2.9,0.2-3.9-2.6-3.9h-3.6L344.6,51h-3.1l4.1-14.7H352.8"/>
      <path class="ffta-logo-st2" d="M365.9,52.3h0.3c1.5,0,2.1,0.7,1.7,2.1c-0.4,1.5-1.6,2.2-3.8,2.2h-1.6l0.4-1.3h1.5c1,0,1.5-0.3,1.7-0.9c0.2-0.6-0.2-0.8-1.2-0.8h-0.7l0.7-2.5h-0.1c-0.1,0-0.3,0-0.5-0.1c-0.8-0.1-1.5-0.2-2-0.3c-2.2-0.6-3.1-3.4-2.2-6.7c0.7-2.3,1.9-4.3,3.6-5.7c1.8-1.4,3.5-2,6.4-2h4.9l-0.7,2.3h-4.9c-3.4,0-5.1,1.4-6.1,5.1c-0.4,1.5-0.5,2.5-0.3,3.4c0.4,1.2,1.3,1.6,3.5,1.6h4.9l-0.7,2.3h-4.6L365.9,52.3"/>
      <path class="ffta-logo-st2" d="M387,42.1h-5.5c-2.6,0-3.9,0.3-5.1,1.4c-0.9,0.8-1.7,1.9-2,3.2c-0.6,2.1,0.1,3.6,1.7,4.1c1,0.3,1.2,0.3,3.6,0.3h7.8l2.6-9.3c0.6-2.2,0.7-3.2,0.2-4.1c-0.6-1-1.7-1.4-4.5-1.4h-7.9l-0.7,2.3h7.3c3,0,3.3,0.5,2.6,3.1L387,42.1 M386.3,44.4l-1.2,4.3H380c-2.2,0-2.9-0.6-2.5-2.1c0.5-1.6,1.4-2.2,3.7-2.2H386.3z"/>
      <path class="ffta-logo-st2" d="M397.4,30.8h3.1l-0.9,3.1h-3.1L397.4,30.8 M399,36.3L394.8,51h-3.1l4.2-14.7H399z"/>
      <path class="ffta-logo-st2" d="M415.3,38.6h-7c-1.7,0-2,0-2.5,0.2c-0.6,0.2-1.2,0.9-1.5,1.9c-0.2,0.6-0.1,1.1,0.1,1.4c0.3,0.3,0.9,0.4,2.5,0.4h2.1l1.7,0c1.7,0,2.3,0.2,2.8,0.8c0.5,0.6,0.6,1.9,0.2,3.3c-0.4,1.5-1.1,2.6-2.1,3.4c-0.5,0.4-1.1,0.7-1.7,0.8c-0.8,0.2-1.2,0.2-3.2,0.2h-8.2l0.7-2.3h7.4c1.1,0,1.8,0,2.2-0.1c0.9-0.1,1.3-0.6,1.6-1.8c0.2-0.7,0.2-1.2-0.1-1.5c-0.3-0.2-0.6-0.3-2.6-0.3h-1.3c-2.6,0-3.1,0-3.9-0.3c-1.4-0.5-2-2.2-1.4-4.1c0.4-1.3,1.2-2.5,2.2-3.2c1.1-0.8,2.4-1.1,4.8-1.1h7.8L415.3,38.6"/>
      <path class="ffta-logo-st2" d="M429.2,44.6h-9.3c-0.4,1.5-0.4,2.4,0.2,3.1c0.2,0.4,0.6,0.6,1,0.7c0.5,0.2,1.6,0.2,2.5,0.2h4.5l-0.7,2.3h-5.3c-2.2,0-3.2-0.2-4.1-0.8c-1.5-1.1-1.9-3.4-1.1-6.2c1.4-5,5-7.7,10.3-7.7h4.4l-0.7,2.3h-4c-2.2,0-3.3,0.3-4.3,1.1c-0.8,0.6-1.4,1.4-2,2.6h9.3L429.2,44.6"/>
      <polyline class="ffta-logo-st2" points="254.8,59.4 251.5,63.5 249.9,63.5 252.5,59.7 251.5,59.7 252.4,56.4 255.6,56.4 254.8,59.4"/>
      <path class="ffta-logo-st2" d="M141.2,61.9h-3.5c-3.2,0-5.5,0.8-7.2,2.6c-1.2,1.3-2.3,3.2-2.8,5.1c-0.9,3.3-0.2,5.8,1.8,6.6c0.9,0.4,1.9,0.5,3.7,0.5h6.9l5.7-20.2h-3.1L141.2,61.9 M137.7,74.3h-3.8c-3.1,0-3.9-1.4-2.9-5.1c0.6-2.1,1.5-3.4,2.8-4.2c0.9-0.6,1.9-0.8,3.5-0.8h3.3L137.7,74.3z"/>
      <path class="ffta-logo-st2" d="M157.7,70.2h-9.3c-0.4,1.5-0.4,2.4,0.2,3.1c0.2,0.4,0.6,0.6,1,0.7c0.5,0.2,1.6,0.2,2.5,0.2h4.4l-0.7,2.3h-5.3c-2.2,0-3.2-0.2-4.1-0.8c-1.5-1.1-1.9-3.4-1.1-6.2c1.4-5,5-7.7,10.3-7.7h4.4l-0.7,2.3h-4c-2.2,0-3.3,0.3-4.3,1.1c-0.8,0.6-1.4,1.4-2,2.6h9.3L157.7,70.2"/>
      <polyline class="ffta-logo-st2" points="170.4,59 171.1,56.4 189.1,56.4 188.4,59 181.1,59 176.2,76.6 172.8,76.6 177.7,59 170.4,59"/>
      <path class="ffta-logo-st2" d="M191.4,56.4h3.1l-0.9,3.1h-3.1L191.4,56.4 M193,61.9l-4.1,14.7h-3.1l4.1-14.7H193z"/>
      <path class="ffta-logo-st2" d="M201.3,61.9c2.6,0,3.7,0.3,4.4,1.1c0.7,0.8,0.7,1.8,0.1,4.1l-0.4,1.4h-2.9l0.4-1.4c0.6-2.1,0.2-2.8-2-2.8h-1.2l-3.4,12.3h-3.1l4.1-14.7H201.3"/>
      <path class="ffta-logo-st2" d="M225.7,56h-3.5l3.3,4h2.3L225.7,56 M226.9,67.6h-5.5c-2.6,0-3.9,0.3-5.1,1.4c-0.9,0.8-1.7,1.9-2,3.2c-0.6,2.1,0.1,3.6,1.7,4.1c1,0.3,1.2,0.3,3.6,0.3h7.8l2.6-9.3c0.6-2.2,0.7-3.2,0.2-4.1c-0.6-1-1.7-1.4-4.5-1.4h-7.9l-0.7,2.3h7.3c3,0,3.3,0.5,2.6,3.1L226.9,67.6z M226.2,70l-1.2,4.3h-5.1c-2.2,0-2.9-0.6-2.5-2.1c0.5-1.6,1.4-2.2,3.7-2.2H226.2z"/>
      <polyline class="ffta-logo-st2" points="239.5,76.6 245.2,56.4 248.3,56.4 242.6,76.6 239.5,76.6"/>
      <path class="ffta-logo-st2" d="M249.3,76.6h3.6l3.7-5.3h10l0.7,5.3h3.6l-2.7-20.2h-4.4L249.3,76.6 M265.2,58.9l1.1,9.9h-7.9L265.2,58.9z"/>
      <path class="ffta-logo-st2" d="M281.4,61.9c2.6,0,3.7,0.3,4.4,1.1c0.7,0.8,0.7,1.8,0.1,4.1l-0.4,1.4h-2.9l0.4-1.4c0.6-2.1,0.2-2.8-2-2.8h-1.2l-3.4,12.3h-3.1l4.1-14.7H281.4"/>
      <path class="ffta-logo-st2" d="M301.2,64.2h-4.9c-3.4,0-5.1,1.4-6.1,5.1c-0.4,1.5-0.5,2.5-0.3,3.4c0.4,1.2,1.3,1.6,3.5,1.6h4.9l-0.7,2.3h-4.9c-3.2,0-4.6-0.4-5.4-1.7c-0.8-1.3-1-3.3-0.4-5.4c0.7-2.3,1.9-4.3,3.6-5.7c1.8-1.4,3.5-2,6.4-2h4.9L301.2,64.2"/>
    </g>
    <path class="ffta-logo-st0" d="M6.8,95.3c-0.4,1.4-1.9,2.6-3.3,2.6c-1.4,0-2.3-1.2-1.9-2.6c0,0,2.7-9.6,2.7-9.6c2.6-10.3,12.7-9.3,12.7-9.3h5.7c1.2,0,2,1,1.6,2.2c-0.3,1.2-1.6,2.2-2.8,2.2h-4.9c0,0-5.6-0.6-6.9,3.9h9.4c1.3,0,2.1,1.1,1.7,2.4c-0.3,1.3-1.7,2.4-3,2.4H8.4C8.3,89.9,6.8,95.3,6.8,95.3"/>
    <path class="ffta-logo-st0" d="M27.8,95.3c-0.4,1.4-1.9,2.6-3.3,2.6c-1.4,0-2.3-1.2-1.9-2.6c0,0,2.7-9.6,2.7-9.6C27.8,75.4,38,76.3,38,76.3h5.7c1.2,0,2,1,1.6,2.2c-0.3,1.2-1.6,2.2-2.8,2.2h-4.9c0,0-5.6-0.6-6.9,3.9H40c1.3,0,2.1,1.1,1.7,2.4c-0.3,1.3-1.7,2.4-3,2.4h-9.2C29.4,89.9,27.8,95.3,27.8,95.3"/>
    <path class="ffta-logo-st0" d="M55.2,95.3c-0.4,1.4-1.9,2.6-3.3,2.6c-1.4,0-2.3-1.2-1.9-2.6l4-14.5h-4.7c-1.2,0-2-1-1.6-2.2c0.3-1.2,1.6-2.2,2.8-2.2h14.9c1.2,0,2,1,1.6,2.2c-0.3,1.2-1.6,2.2-2.8,2.2h-5L55.2,95.3"/>
    <path class="ffta-logo-st2" d="M79.2,93.3h-7.8c-1.1,0-1.7-0.9-1.4-2c0.3-1.1,1.4-2,2.5-2h7.8L79.2,93.3 M82.6,76.3H71.7c-1.2,0-2.5,1-2.8,2.3c-0.3,1.2,0.4,2.3,1.6,2.3H79c2.1,0,3.9,0.2,2.7,3.8H72c-3.6,0-7.4,3-8.4,6.7c-1,3.6,1.2,6.6,4.8,6.6h15.2l3.9-14.7C88.6,79.4,86.3,76.3,82.6,76.3z"/>
  </g>
</svg>`;


async function bootstrap() {
  const root = document.getElementById('ffta-app');
  if (!root) return;

  root.innerHTML = '<div class="cp-loader"><span class="cp-loader__spinner"></span></div>';

  const baseUrl = new URL('./', import.meta.url).href;

  try {
    const runtime = await createIanseoRuntime({ baseUrl });
    const app = createModuleContext(runtime);
    installDevHooks(app);
    const registry = createModuleRegistry();
    const pageMounts = new Map();

    app.i18n.registerNamespace('app', { en: coreEn, fr: coreFr });

    app.logger.info('Runtime initialized', { runtime: runtime.type, baseUrl, devMode: app.dev.enabled }, 'runtime');

    const discoveredModules = getDiscoveredModules();
    const manifestsById = await loadDiscoveredManifests({ discoveredModules, baseUrl });
    const enabledModuleIds = await resolveEnabledModuleIds({ app, discoveredModules, manifestsById });
    const accessByModuleId = await resolveModuleAccess({ app, discoveredModules, manifestsById });
    const enabledModules = discoveredModules.filter((moduleDefinition) => {
      const access = accessByModuleId.get(moduleDefinition.id) || 'write';
      return enabledModuleIds.includes(moduleDefinition.id) && access !== 'none';
    });

    for (const moduleDefinition of enabledModules) {
      try {
        const loadedModule = await loadDiscoveredModule({
          moduleDefinition,
          manifest: manifestsById.get(moduleDefinition.id),
          app,
          registry,
          baseUrl
        });

        if (loadedModule?.mountPage) {
          pageMounts.set(loadedModule.manifest.id, loadedModule.mountPage);
        }
      } catch (error) {
        const moduleId = moduleDefinition.id || moduleDefinition.manifestPath || 'unknown';
        console.error(`[ffta] Module failed: ${moduleId}`, error);
        app.notify.error(`Module failed: ${moduleId}`);
      }
    }

    mountShell({ root, app, pageMounts, manifestsById, discoveredModules, enabledModuleIds, accessByModuleId });
  } catch (error) {
    console.error('[ffta] Bootstrap failed', error);
    root.innerHTML = `<div class="ffta-page"><p class="ffta-badge ffta-badge--error">${escapeHtml(String(error))}</p></div>`;
  }
}


function installDevHooks(app) {
  if (!app?.dev?.enabled) return;
  app.logger.info('Dev mode enabled', app.dev.config, 'runtime');
  if (app.dev.shouldExposeGlobal()) {
    window.__FFTA_APP__ = app;
    window.__FFTA_DEV__ = app.dev.config;
    app.logger.info('Global debug handles exposed: window.__FFTA_APP__, window.__FFTA_DEV__', null, 'runtime');
  }
}

function buildDevBadge(app) {
  const enabledLogs = Object.entries(app.dev.config.logs || {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)
    .join(', ') || 'none';
  return `<aside class="ffta-dev-badge" title="Dev mode is enabled. Do not use this setting in production.">
    <strong>DEV MODE</strong>
    <span>level: ${escapeHtml(app.dev.config.logLevel)}</span>
    <span>logs: ${escapeHtml(enabledLogs)}</span>
  </aside>`;
}

function getDiscoveredModules() {
  const modules = Array.isArray(window.__FFTA_MODULES__) ? window.__FFTA_MODULES__ : [];
  return modules
    .filter((moduleDefinition) => moduleDefinition && moduleDefinition.id && moduleDefinition.manifestPath)
    .sort((left, right) => {
      if (left.id === 'league') return -1;
      if (right.id === 'league') return 1;
      return String(left.id).localeCompare(String(right.id));
    });
}

async function loadDiscoveredManifests({ discoveredModules, baseUrl }) {
  const manifestsById = new Map();

  for (const moduleDefinition of discoveredModules) {
    try {
      const manifestModule = await import(new URL(moduleDefinition.manifestPath, baseUrl).href);
      const manifest = manifestModule.default;
      if (!manifest?.id) {
        throw new Error(`Invalid manifest for discovered module: ${moduleDefinition.id}`);
      }
      if (manifest.id !== moduleDefinition.id) {
        throw new Error(`Manifest id mismatch: expected ${moduleDefinition.id}, got ${manifest.id}`);
      }
      manifestsById.set(manifest.id, manifest);
    } catch (error) {
      console.error(`[ffta] Manifest failed: ${moduleDefinition.id}`, error);
    }
  }

  return manifestsById;
}

async function resolveEnabledModuleIds({ app, discoveredModules, manifestsById }) {
  const availableIds = discoveredModules
    .map((moduleDefinition) => moduleDefinition.id)
    .filter((id) => manifestsById.has(id));
  const storedValue = await app.settings.get('enabledModules', null);
  const storedIds = normalizeEnabledModules(storedValue, availableIds);

  if (storedIds === null) {
    await app.settings.set('enabledModules', availableIds);
    return availableIds;
  }

  return storedIds;
}


async function resolveModuleAccess({ app, discoveredModules, manifestsById }) {
  const accessByModuleId = new Map();
  for (const moduleDefinition of discoveredModules) {
    const manifest = manifestsById.get(moduleDefinition.id);
    if (!manifest) continue;
    const access = await app.acl.getAccess(manifest);
    accessByModuleId.set(moduleDefinition.id, access);
  }
  return accessByModuleId;
}

function normalizeEnabledModules(value, availableIds) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = raw.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  if (!Array.isArray(raw)) {
    return null;
  }

  return raw
    .map((id) => String(id))
    .filter((id, index, all) => availableIds.includes(id) && all.indexOf(id) === index);
}

async function loadDiscoveredModule({ moduleDefinition, manifest, app, registry, baseUrl }) {
  if (!manifest) {
    throw new Error(`Missing manifest for discovered module: ${moduleDefinition.id}`);
  }

  const moduleBaseUrl = new URL(`./modules/${moduleDefinition.id}/`, baseUrl).href;

  if ((manifest.type || 'mvvm') === 'simple') {
    await loadManifestI18n({ app, manifest, moduleBaseUrl });
    registerSimpleModule({ app, manifest });
    const mountPage = await resolveSimplePageMount({ manifest, moduleBaseUrl }) || createSimpleModuleMountPage({ manifest });
    return { manifest, mountPage };
  }

  const entryPath = manifest.entry || './module.mount.js';
  const entryModule = await import(new URL(entryPath, moduleBaseUrl).href);

  if (typeof entryModule.mountModule !== 'function') {
    throw new Error(`Module entry does not export mountModule(): ${manifest.id}`);
  }

  await loadModule({
    manifest,
    mountModule: entryModule.mountModule,
    app,
    registry
  });

  const mountPage = await resolvePageMount({ manifest, moduleBaseUrl });
  return { manifest, mountPage };
}


async function loadManifestI18n({ app, manifest, moduleBaseUrl }) {
  const files = Array.isArray(manifest.i18n) ? manifest.i18n : [];
  if (!files.length) return;

  const translations = {};
  for (const file of files) {
    try {
      const response = await fetch(new URL(file, moduleBaseUrl).href);
      if (!response.ok) continue;
      const language = String(file).includes('/fr') || String(file).endsWith('fr.json') ? 'fr' : 'en';
      translations[language] = await response.json();
    } catch (error) {
      console.warn(`[ffta] Unable to load i18n file for ${manifest.id}: ${file}`, error);
    }
  }
  if (Object.keys(translations).length > 0) {
    app.i18n.registerNamespace(manifest.id, translations);
  }
}

function registerSimpleModule({ app, manifest }) {
  const titleKey = manifest.page?.titleKey || `${manifest.id}.title`;
  app.menu.register({
    id: manifest.id,
    label: app.t(titleKey),
    route: `/${manifest.id}`
  });
}


async function resolveSimplePageMount({ manifest, moduleBaseUrl }) {
  const indexPath = manifest.page?.index;
  if (!indexPath) return null;
  const pageModule = await import(new URL(indexPath, moduleBaseUrl).href);
  const mountPage = pageModule.mountSimpleModulePage || pageModule.default;
  if (typeof mountPage !== 'function') {
    throw new Error(`Simple page ${indexPath} must export mountSimpleModulePage() or default.`);
  }
  return function mountResolvedSimplePage({ root, app }) {
    return mountPage({ root, app, manifest });
  };
}

function createSimpleModuleMountPage({ manifest }) {
  return function mountSimpleModulePage({ root, app }) {
    let isMounted = true;

    async function runAction(action) {
      const permission = action.permission || 'read';
      const moduleAccess = app.acl.getCachedAccess(manifest.id);
      if (permission === 'write' && moduleAccess !== 'write') {
        app.notify.error(app.t('app.acl.writeDenied'));
        return;
      }

      try {
        const handler = action.handler || {};
        let result = null;
        if (handler.service && handler.method) {
          const service = app.data?.[handler.service];
          if (!service || typeof service[handler.method] !== 'function') {
            throw new Error(`Unknown simple action handler: ${handler.service}.${handler.method}`);
          }
          result = await service[handler.method](handler.payload || {});
        }
        if (action.successMessageKey) {
          app.notify.success(app.t(action.successMessageKey));
        }
        if (isMounted) render(result);
      } catch (error) {
        console.error(`[ffta] Simple module action failed: ${action.id}`, error);
        app.notify.error(error.message || app.t('app.simple.actionFailed'));
      }
    }

    function render(lastResult = null) {
      const title = app.t(manifest.page?.titleKey || `${manifest.id}.title`);
      const description = app.t(manifest.page?.descriptionKey || `${manifest.id}.description`);
      const access = app.acl.getCachedAccess(manifest.id);
      const actions = Array.isArray(manifest.page?.actions) ? manifest.page.actions : [];

      root.innerHTML = `
        <section class="ffta-page ffta-simple-page">
          <div class="ffta-page__header">
            <div>
              <h1>${escapeHtml(title)}</h1>
              <p class="ffta-muted">${escapeHtml(description)}</p>
            </div>
            <span class="ffta-badge">${escapeHtml(access.toUpperCase())}</span>
          </div>
          ${access === 'read' ? `<p class="ffta-badge">${escapeHtml(app.t('app.acl.readOnly'))}</p>` : ''}
          <article class="cp-card">
            <div class="ffta-simple-actions">
              ${actions.map((action) => buildSimpleActionButton({ action, app, access })).join('')}
            </div>
            ${lastResult ? `<pre class="ffta-simple-result">${escapeHtml(JSON.stringify(lastResult, null, 2))}</pre>` : ''}
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

    root.addEventListener('click', handleClick);
    render();

    return function unmountSimpleModulePage() {
      isMounted = false;
      root.removeEventListener('click', handleClick);
    };
  };
}

function buildSimpleActionButton({ action, app, access }) {
  const label = app.t(action.labelKey || action.id);
  const requiresWrite = (action.permission || 'read') === 'write';
  const disabled = requiresWrite && access !== 'write';
  return `<button type="button" class="cp-button ${requiresWrite ? 'cp-button--primary' : ''}" data-simple-action="${escapeAttribute(action.id)}" ${disabled ? 'disabled' : ''}>${escapeHtml(label)}</button>`;
}

async function resolvePageMount({ manifest, moduleBaseUrl }) {
  const routesPath = manifest.routes || './module.routes.js';
  const routesModule = await import(new URL(routesPath, moduleBaseUrl).href);
  const routes = Array.isArray(routesModule.default) ? routesModule.default : [];
  const firstPageRoute = routes.find((route) => route?.component);

  if (!firstPageRoute) {
    return null;
  }

  const componentName = firstPageRoute.component;
  const pageModule = await import(new URL(`./ui/pages/${componentName}.js`, moduleBaseUrl).href);
  const expectedExportName = `mount${componentName}`;
  const mountPage = pageModule[expectedExportName] || pageModule.default;

  if (typeof mountPage !== 'function') {
    throw new Error(`Page component ${componentName} does not export ${expectedExportName}() or default.`);
  }

  return mountPage;
}

function mountShell({ root, app, pageMounts, manifestsById, discoveredModules, enabledModuleIds, accessByModuleId }) {
  let unmountCurrent = null;
  let currentEnabledModuleIds = [...enabledModuleIds];

  function getMenuItems() {
    return [
      ...app.menu.list(),
      {
        route: '/settings',
        label: app.t('app.settings.title'),
        accentColor: '#d64031',
        isSystem: true
      }
    ];
  }

  function getActiveModuleId() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const firstSegment = hash.split('/')[0];
    if (firstSegment) return firstSegment;

    const firstMenuItem = getMenuItems()[0];
    return firstMenuItem ? normalizeRoute(firstMenuItem.route) : 'settings';
  }

  function renderShell() {
    const menuItems = getMenuItems();
    const activeModuleId = getActiveModuleId();
    const activeItem = menuItems.find((item) => normalizeRoute(item.route) === activeModuleId) ?? menuItems[0];
    const activeId = activeItem ? normalizeRoute(activeItem.route) : activeModuleId;

    if (unmountCurrent) {
      unmountCurrent();
      unmountCurrent = null;
    }

    root.innerHTML = `
      <section class="ffta-shell">
        <header class="ffta-shell__header">
          <div class="ffta-shell__brand" aria-label="${escapeAttribute(app.t('app.title'))}">
            ${FFTA_LOGO_SVG}
          </div>
          <div class="ffta-shell__actions">
            <nav class="ffta-shell__nav" aria-label="FFTA modules">
              ${menuItems.map((item) => buildMenuItem(item, activeId, manifestsById)).join('')}
            </nav>
            <button type="button" class="ffta-update-button" data-action="update-module">[${escapeHtml(app.t('app.actions.updateModule'))}]</button>
          </div>
        </header>
        ${app.dev.shouldShowBadge() ? buildDevBadge(app) : ''}
        <div id="ffta-module-outlet" class="ffta-shell__outlet"></div>
      </section>
    `;

    const updateButton = root.querySelector('[data-action="update-module"]');
    if (updateButton) {
      updateButton.addEventListener('click', () => installUpdate({ app, button: updateButton }));
    }

    const outlet = root.querySelector('#ffta-module-outlet');
    if (!outlet) return;

    if (activeId === 'settings') {
      unmountCurrent = mountSettingsPage({
        root: outlet,
        app,
        manifestsById,
        discoveredModules,
        enabledModuleIds: currentEnabledModuleIds,
        accessByModuleId,
        onSaved: async (nextEnabledModuleIds) => {
          currentEnabledModuleIds = nextEnabledModuleIds;
          await app.settings.set('enabledModules', nextEnabledModuleIds);
          app.notify.success(app.t('app.settings.saved'));
          window.location.reload();
        }
      });
      return;
    }

    const mountPage = pageMounts.get(activeId) ?? pageMounts.values().next().value;
    if (outlet && mountPage) {
      let vm = null;
      try {
        vm = app.services.get(`${activeId}.vm`);
      } catch (error) {
        vm = null;
      }
      unmountCurrent = mountPage({ root: outlet, vm, app });
    } else {
      outlet.innerHTML = `<div class="ffta-page"><p>${escapeHtml(app.t('app.settings.noEnabledModule'))}</p></div>`;
    }
  }

  function handleHashChange() {
    renderShell();
  }

  window.addEventListener('hashchange', handleHashChange);
  renderShell();

  return function unmountShell() {
    window.removeEventListener('hashchange', handleHashChange);
    if (unmountCurrent) unmountCurrent();
  };
}

function mountSettingsPage({ root, app, manifestsById, discoveredModules, enabledModuleIds, accessByModuleId, onSaved }) {
  const enabledSet = new Set(enabledModuleIds);
  const modules = discoveredModules
    .map((moduleDefinition) => manifestsById.get(moduleDefinition.id))
    .filter(Boolean);

  root.innerHTML = `
    <section class="ffta-page ffta-settings-page">
      <div class="ffta-page__header">
        <div>
          <h1>${escapeHtml(app.t('app.settings.title'))}</h1>
          <p class="ffta-muted">${escapeHtml(app.t('app.settings.description'))}</p>
        </div>
      </div>
      <div class="cp-card ffta-settings-card">
        <div class="ffta-settings-card__header">
          <h2>${escapeHtml(app.t('app.settings.enabledModules'))}</h2>
          <p>${escapeHtml(app.t('app.settings.enabledModulesHelp'))}</p>
        </div>
        <div class="ffta-module-toggle-list">
          ${modules.map((manifest) => buildModuleToggle({ manifest, enabled: enabledSet.has(manifest.id), access: accessByModuleId?.get(manifest.id) || 'write' })).join('')}
        </div>
        <div class="ffta-settings-actions">
          <button type="button" class="cp-button cp-button--primary" data-action="save-settings">${escapeHtml(app.t('app.actions.save'))}</button>
        </div>
      </div>
    </section>
  `;

  const saveButton = root.querySelector('[data-action="save-settings"]');
  saveButton?.addEventListener('click', async () => {
    const nextEnabledModuleIds = [...root.querySelectorAll('[data-module-toggle]:checked')]
      .map((input) => input.getAttribute('data-module-toggle'))
      .filter(Boolean);
    await onSaved(nextEnabledModuleIds);
  });

  return function unmountSettingsPage() {};
}

function buildModuleToggle({ manifest, enabled, access = 'write' }) {
  const accentColor = manifest?.navigation?.accentColor || manifest?.accentColor || '#0254a8';
  return `
    <label class="ffta-module-toggle" style="--ffta-module-accent:${escapeAttribute(accentColor)}">
      <input type="checkbox" data-module-toggle="${escapeAttribute(manifest.id)}" ${enabled ? 'checked' : ''}>
      <span class="ffta-module-toggle__indicator"></span>
      <span class="ffta-module-toggle__content">
        <span class="ffta-module-toggle__name">${escapeHtml(manifest.name || manifest.id)}</span>
        <span class="ffta-module-toggle__description">${escapeHtml(manifest.description || '')} · ${escapeHtml(access.toUpperCase())}</span>
      </span>
    </label>
  `;
}

async function installUpdate({ app, button }) {
  const previousLabel = button.textContent;
  button.disabled = true;
  button.textContent = `[${app.t('app.actions.updatingModule')}]`;

  try {
    const response = await fetch(app.runtime.baseUrl + 'core/update/update.php?action=install', {
      method: 'POST'
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || 'Update failed.');
    }

    button.textContent = `[${app.t('app.actions.updateInstalled')}]`;
    window.location.reload();
  } catch (error) {
    console.error('[ffta] Update failed', error);
    app.notify.error(error.message || app.t('app.actions.updateFailed'));
    button.disabled = false;
    button.textContent = previousLabel;
  }
}

function buildMenuItem(item, activeId, manifestsById) {
  const id = normalizeRoute(item.route);
  const isActive = id === activeId;
  const manifest = manifestsById?.get(id);
  const accentColor = item.accentColor || manifest?.navigation?.accentColor || manifest?.accentColor || '#ffffff';

  return `<a class="ffta-shell__nav-item${isActive ? ' is-active' : ''}" style="--ffta-module-accent:${escapeAttribute(accentColor)}" href="#/${escapeAttribute(id)}">${escapeHtml(item.label)}</a>`;
}

function normalizeRoute(route) {
  return String(route ?? '').replace(/^\//, '') || 'league';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

bootstrap();
