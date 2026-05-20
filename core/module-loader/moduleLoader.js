import { validateModuleManifest } from './moduleValidator.js';
import { assertRuntimeCompatibility } from './runtimeResolver.js';

export async function loadModule({ manifest, mountModule, app, registry }) {
  const validation = validateModuleManifest(manifest);
  if (!validation.ok) {
    throw new Error(`Invalid module manifest: ${validation.errors.join(', ')}`);
  }

  assertRuntimeCompatibility(manifest, app.runtime.type);
  injectModuleStyles({ manifest, baseUrl: app.runtime.baseUrl });

  const mountedModule = await mountModule(app);
  registry.register(manifest, mountedModule ?? {});

  return mountedModule;
}

function injectModuleStyles({ manifest, baseUrl }) {
  const styles = Array.isArray(manifest.styles) ? manifest.styles : [];
  for (const stylePath of styles) {
    const href = new URL(`./modules/${manifest.id}/${stylePath.replace(/^\.\//, '')}`, baseUrl).href;
    if (document.querySelector(`link[data-ffta-module-style="${manifest.id}"][href="${href}"]`)) continue;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.fftaModuleStyle = manifest.id;
    document.head.appendChild(link);
  }
}
