import { validateModuleManifest } from './moduleValidator.js';
import { assertRuntimeCompatibility } from './runtimeResolver.js';

export async function loadModule({ manifest, mountModule, app, registry }) {
  const validation = validateModuleManifest(manifest);
  if (!validation.ok) {
    throw new Error(`Invalid module manifest: ${validation.errors.join(', ')}`);
  }

  assertRuntimeCompatibility(manifest, app.runtime.type);

  const mountedModule = await mountModule(app);
  registry.register(manifest, mountedModule ?? {});

  return mountedModule;
}
