/**
 * @param {{ app: Object }} options
 */
export function createIanseoLeagueRepository({ app }) {
  const baseUrl = app.runtime?.baseUrl ?? './';
  const apiBase = baseUrl + 'modules/league/api/league.php';

  return {
    async getLeagueInput() {
      const response = await fetch(apiBase + '?action=getLeagueInput');
      if (!response.ok) {
        throw new Error(`League API error: HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(payload.error || 'Unable to load league input.');
      }
      return payload.data;
    },

    async listTournaments() {
      const response = await fetch(apiBase + '?action=listTournaments');
      if (!response.ok) {
        throw new Error(`League API error: HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(payload.error || 'Unable to list tournaments.');
      }
      return payload.data || [];
    },

    async saveSettings(settings) {
      const response = await fetch(apiBase + '?action=saveSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) {
        throw new Error(`League API error: HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(payload.error || 'Unable to save league settings.');
      }
    }
  };
}
