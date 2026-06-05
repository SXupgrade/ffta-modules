export function createIanseoAclAdapter({ baseUrl = './', devConfig = null } = {}) {
  return {
    async getAccess(manifestOrModuleId) {
      const manifest = typeof manifestOrModuleId === 'string' ? { id: manifestOrModuleId } : (manifestOrModuleId || {});
      const url = baseUrl + 'api/acl.php?action=moduleAccess';
      if (shouldLogApi(devConfig)) console.debug('[ffta:api] POST', url, { moduleId: manifest.id, access: manifest.access || null });
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: manifest.id,
          access: manifest.access || null
        })
      });
      if (!response.ok) return 'write';
      const payload = await response.json().catch(() => ({}));
      if (shouldLogApi(devConfig)) console.debug('[ffta:api] ACL response', { moduleId: manifest.id, status: response.status, payload });
      return payload.ok ? payload.access : 'write';
    }
  };
}

function shouldLogApi(devConfig) {
  return Boolean(devConfig?.devMode && (devConfig.logs?.api || devConfig.logs?.all));
}
