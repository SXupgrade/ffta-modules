const ACCESS_NONE = 'none';
const ACCESS_READ = 'read';
const ACCESS_WRITE = 'write';

export function createAclService(adapter = null, dev = null, logger = null) {
  const cache = new Map();

  function normalizeAccess(value) {
    const access = String(value || '').toLowerCase();
    if (access === ACCESS_WRITE || access === 'readwrite' || access === 'rw') return ACCESS_WRITE;
    if (access === ACCESS_READ || access === 'readonly' || access === 'ro') return ACCESS_READ;
    return ACCESS_NONE;
  }

  function getModuleId(moduleOrManifest) {
    if (typeof moduleOrManifest === 'string') return moduleOrManifest;
    return moduleOrManifest?.id || '';
  }

  async function getAccess(moduleOrManifest) {
    const moduleId = getModuleId(moduleOrManifest);
    if (!moduleId) return ACCESS_NONE;
    if (cache.has(moduleId)) return cache.get(moduleId);

    let access = ACCESS_WRITE;
    try {
      if (dev?.isEnabled?.('acl')) logger?.debug?.('ACL lookup started', { moduleId, moduleOrManifest }, 'acl');
      access = normalizeAccess(await adapter?.getAccess?.(moduleOrManifest));
      if (dev?.isEnabled?.('acl')) logger?.debug?.('ACL lookup resolved', { moduleId, access }, 'acl');
    } catch (error) {
      logger?.warn?.(`ACL lookup failed for ${moduleId}; falling back to write access.`, error, 'acl');
      access = ACCESS_WRITE;
    }
    cache.set(moduleId, access);
    return access;
  }

  function getCachedAccess(moduleOrManifest) {
    const moduleId = getModuleId(moduleOrManifest);
    return cache.get(moduleId) || ACCESS_WRITE;
  }

  return {
    ACCESS_NONE,
    ACCESS_READ,
    ACCESS_WRITE,
    getAccess,
    getCachedAccess,
    async canRead(moduleOrManifest) {
      const access = await getAccess(moduleOrManifest);
      return access === ACCESS_READ || access === ACCESS_WRITE;
    },
    async canWrite(moduleOrManifest) {
      return (await getAccess(moduleOrManifest)) === ACCESS_WRITE;
    },
    canReadCached(moduleOrManifest) {
      const access = getCachedAccess(moduleOrManifest);
      return access === ACCESS_READ || access === ACCESS_WRITE;
    },
    canWriteCached(moduleOrManifest) {
      return getCachedAccess(moduleOrManifest) === ACCESS_WRITE;
    },
    requireWrite(moduleOrManifest) {
      if (!this.canWriteCached(moduleOrManifest)) {
        throw new Error('Write access denied for this module.');
      }
    }
  };
}
