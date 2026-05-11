export function createModuleRegistry() {
  const modules = new Map();

  return {
    register(manifest, mountedModule) {
      if (modules.has(manifest.id)) {
        throw new Error(`Module already registered: ${manifest.id}`);
      }
      modules.set(manifest.id, { manifest, mountedModule });
    },
    get(moduleId) {
      return modules.get(moduleId) ?? null;
    },
    list() {
      return Array.from(modules.values());
    }
  };
}
