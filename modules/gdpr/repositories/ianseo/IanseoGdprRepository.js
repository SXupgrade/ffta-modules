export function createIanseoGdprRepository({ app }) {
  const baseUrl = app.runtime?.baseUrl ?? './';
  const apiBase = baseUrl + 'modules/gdpr/api/gdpr.php';

  async function request(action, options = {}) {
    const response = await fetch(apiBase + `?action=${encodeURIComponent(action)}`, options);
    if (!response.ok) throw new Error(`GDPR API error: HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || 'GDPR API error.');
    return payload;
  }

  return {
    async getStatus() {
      return (await request('status')).data;
    },
    async previewPublish(selection) {
      return (await request('preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selection)
      })).data;
    },
    async publish(selection) {
      return (await request('publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selection)
      })).data;
    },
    async listParticipants() {
      return (await request('list-participants')).data;
    },
    async setParticipantOptOut(entryId, optOut) {
      return (await request('set-participant-optout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, optOut })
      })).data;
    }
  };
}
