export function createIanseoLeagueRepository() {
  return {
    async getLeagueInput() {
      const response = await fetch('modules/league/api/league.php?action=getLeagueInput');
      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(payload.error || 'Unable to load league input.');
      }
      return payload.data;
    },
    async saveSettings(settings) {
      const response = await fetch('modules/league/api/league.php?action=saveSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(payload.error || 'Unable to save league settings.');
      }
    }
  };
}
