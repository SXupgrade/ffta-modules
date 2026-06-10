export function createIanseoRecordsRepository({ app }) {
  const baseUrl = app.runtime?.baseUrl ?? './';
  const apiBase = baseUrl + 'modules/records/api/records.php';

  async function request(action, options = {}) {
    const response = await fetch(apiBase + `?action=${encodeURIComponent(action)}`, options);
    if (!response.ok) throw new Error(`Records API error: HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || 'Records API error.');
    return payload;
  }

  return {
    async getRecordsDashboard() {
      return (await request('getDashboard')).data;
    },
    async saveRecordArea(input) {
      await request('saveRecordArea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
    },
    async deleteRecordArea(input) {
      await request('deleteRecordArea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
    },
    async syncTournamentRecordAreas(payload) {
      return request('syncTournamentRecordAreas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    },
    async updateGlobalRecordsFromBroken() {
      return request('updateGlobalRecordsFromBroken', { method: 'POST' });
    },
    async saveMonitoredRecord(input) {
      await request('saveMonitoredRecord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
    },
    async saveRecord(payload) {
      await request('saveRecord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    },
    async importRecords(payload) {
      await request('importRecords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    },
    async activateTournamentRecords(payload) {
      return request('activateTournamentRecords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    },
    async checkBrokenRecords() {
      return request('checkBrokenRecords', { method: 'POST' });
    }
  };
}
