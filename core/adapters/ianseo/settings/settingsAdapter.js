/**
 * @param {{ baseUrl?: string }} options
 */
export function createIanseoSettingsAdapter({ baseUrl = './' } = {}) {
  return {
    async get(key) {
      const response = await fetch(
        baseUrl + 'api/settings.php?action=get&key=' + encodeURIComponent(key)
      );
      if (!response.ok) return null;
      const payload = await response.json();
      return payload.value ?? null;
    },
    async set(key, value) {
      const response = await fetch(baseUrl + 'api/settings.php?action=set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (!response.ok) return null;
      return response.json();
    }
  };
}
