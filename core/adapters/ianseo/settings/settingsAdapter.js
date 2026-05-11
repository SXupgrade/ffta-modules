export function createIanseoSettingsAdapter() {
  return {
    async get(key) {
      const response = await fetch(`api/settings.php?action=get&key=${encodeURIComponent(key)}`);
      const payload = await response.json();
      return payload.value ?? null;
    },
    async set(key, value) {
      const response = await fetch('api/settings.php?action=set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      return response.json();
    }
  };
}
