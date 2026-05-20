export function createIanseoPlanQualifsRepository({ app }) {
  const endpoint = new URL('./modules/plan-qualifs/api/plan-qualifs.php', app.runtime.baseUrl).href;

  async function request(action, params = {}, method = 'GET') {
    const url = new URL(endpoint);
    url.searchParams.set('action', action);

    const options = { credentials: 'same-origin' };

    if (method === 'POST') {
      options.method = 'POST';
      const body = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) body.set(key, String(value));
      }
      options.body = body;
      options.headers = { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' };
    } else {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url.href, options);
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || `PlanQualifs API failed: ${response.status}`);
    }
    return payload;
  }

  return {
    endpoint,
    getPlan({ sessionId, grouping }) {
      return request('getPlan', { sessionId, grouping });
    },
    moveArcher({ participantId, sessionId, targetNumber, slotOrder, grouping }) {
      return request('moveArcher', { participantId, sessionId, targetNumber, slotOrder, grouping }, 'POST');
    },
    clearTarget({ sessionId, targetNumber, grouping }) {
      return request('clearTarget', { sessionId, targetNumber, grouping }, 'POST');
    },
    clearSession({ sessionId, grouping }) {
      return request('clearSession', { sessionId, grouping }, 'POST');
    },
    moveTarget({ sessionId, sourceTarget, destinationTarget, grouping }) {
      return request('moveTarget', { sessionId, sourceTarget, destinationTarget, grouping }, 'POST');
    },
    deleteArcher({ participantId, sessionId, grouping }) {
      return request('deleteArcher', { participantId, sessionId, grouping }, 'POST');
    },
    getGlobalRecap() {
      return request('getGlobalRecap');
    }
  };
}
