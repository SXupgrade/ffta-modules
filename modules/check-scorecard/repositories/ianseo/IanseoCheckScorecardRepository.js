export function createIanseoCheckScorecardRepository({ app }) {
  const endpoint = `${app.runtime.baseUrl}modules/check-scorecard/api/check-scorecard.php`;

  async function request(action, payload = {}) {
    const response = await fetch(`${endpoint}?action=${encodeURIComponent(action)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || `Check scorecard API failed: ${action}`);
    }
    return data;
  }

  return {
    async getInitialData() {
      const data = await request('initial');
      return { context: data.context, sessions: data.sessions || [] };
    },
    async listRows(filters) {
      const data = await request('list', filters);
      return data.rows || [];
    },
    async setConfirm(payload) {
      const data = await request('set-confirm', payload);
      return data.row;
    }
  };
}
