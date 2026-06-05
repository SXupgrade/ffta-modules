/**
 * @param {{ baseUrl?: string }} options
 */
export function createIanseoSettingsAdapter({ baseUrl = './', devConfig = null } = {}) {
  return {
    async get(key) {
      const url = baseUrl + 'api/settings.php?action=get&key=' + encodeURIComponent(key);
      if (shouldLogApi(devConfig)) console.debug('[ffta:api] GET', url);
      const response = await fetch(url);
      if (!response.ok) return null;
      const payload = await response.json();
      return payload.value ?? null;
    },
    async set(key, value) {
      const url = baseUrl + 'api/settings.php?action=set';
      if (shouldLogApi(devConfig)) console.debug('[ffta:api] POST', url, { key, value });
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (!response.ok) return null;
      return response.json();
    }
  };
}

function shouldLogApi(devConfig) {
  return Boolean(devConfig?.devMode && (devConfig.logs?.api || devConfig.logs?.all));
}
