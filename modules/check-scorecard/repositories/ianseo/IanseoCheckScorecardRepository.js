export function createIanseoCheckScorecardRepository({ app }) {
  const moduleId = 'check-scorecard';

  async function request(action, payload = {}, permission = 'read') {
    return app.data.request(action, payload, { permission, moduleId });
  }

  return {
    async getInitialData() {
      const [context, sessions] = await Promise.all([
        request('getCheckScorecardContext'),
        request('listCheckScorecardSessions')
      ]);
      return { context, sessions: sessions || [] };
    },
    async listRows(filters) {
      const rows = await request('listCheckScorecardRows', filters);
      return rows || [];
    },
    async setConfirm(payload) {
      return request('setCheckScorecardConfirm', payload, 'write');
    }
  };
}
