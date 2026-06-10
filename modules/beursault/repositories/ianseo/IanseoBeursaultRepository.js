export function createIanseoBeursaultRepository({ app }) {
  const endpoint = `${app.runtime.baseUrl}modules/beursault/api/beursault.php`;

  async function request(action, payload = {}) {
    const response = await fetch(`${endpoint}?action=${encodeURIComponent(action)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || `Beursault API failed: ${action}`);
    }
    return data;
  }

  return {
    async getInitialData() {
      const data = await request('initial');
      return { context: data.context, sessions: data.sessions || [] };
    },
    async listScores(filters) {
      const data = await request('list', filters);
      return data.rows || [];
    },
    async saveScore(score) {
      const data = await request('save', score);
      return data.row;
    }
  };
}
