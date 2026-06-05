export function createIanseoDataAdapter({ baseUrl = './', devConfig = null } = {}) {
  return {
    async request(action, payload = {}) {
      const url = baseUrl + 'api/data.php?action=' + encodeURIComponent(action);
      if (shouldLogApi(devConfig)) console.debug('[ffta:api] POST', url, payload);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      });
      const data = await response.json().catch(() => ({}));
      if (shouldLogApi(devConfig)) console.debug('[ffta:api] response', { action, status: response.status, data });
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Data API error: HTTP ${response.status}`);
      }
      return data.data;
    }
  };
}

function shouldLogApi(devConfig) {
  return Boolean(devConfig?.devMode && (devConfig.logs?.api || devConfig.logs?.all));
}
