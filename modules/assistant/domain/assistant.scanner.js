export async function scanAssistantMetrics({ data } = {}) {
  const scanned = await safeCall(() => data?.request?.('scanTournamentAssistant', {}, { moduleId: 'assistant' }), null);
  if (scanned && typeof scanned === 'object') return normalizeMetrics(scanned);

  const tournament = await safeCall(() => data?.tournament?.getCurrent?.({ moduleId: 'assistant' }), null);
  const entries = await safeCall(() => data?.entries?.list?.({}, { moduleId: 'assistant' }), []);
  const scores = await safeCall(() => data?.scores?.readQualificationScores?.({}, { moduleId: 'assistant' }), []);
  const officials = await safeCall(() => data?.officials?.list?.({}, { moduleId: 'assistant' }), []);

  return buildMetrics({ tournament, entries, scores, officials });
}

export function buildMetrics({ tournament = null, entries = [], scores = [], officials = [] } = {}) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const safeScores = Array.isArray(scores) ? scores : [];
  const safeOfficials = Array.isArray(officials) ? officials : [];
  const assignedEntryCount = safeEntries.filter((entry) => hasTarget(entry.target || entry.targetNo || entry.quTargetNo || entry.QuTargetNo)).length;
  const scoredEntryCount = safeScores.filter((score) => Number(score.score || score.total || score.quScore || score.QuScore || 0) > 0).length;
  const rankedEntryCount = safeScores.filter((score) => Number(score.rank || score.quRank || score.quClRank || score.QuClRank || 0) > 0).length;
  const responsibleJudgeCount = safeOfficials.filter(isResponsibleJudge).length;

  return normalizeMetrics({
    scannedAt: new Date().toISOString(),
    tournamentName: tournament?.name || tournament?.ToName || tournament?.title || '',
    tournamentCode: tournament?.code || tournament?.ToCode || tournament?.id || '',
    entryCount: safeEntries.length,
    assignedEntryCount,
    scoredEntryCount,
    rankedEntryCount,
    responsibleJudgeCount
  });
}

function normalizeMetrics(metrics = {}) {
  return {
    scannedAt: metrics.scannedAt || new Date().toISOString(),
    tournamentName: metrics.tournamentName || '',
    tournamentCode: metrics.tournamentCode || '',
    entryCount: number(metrics.entryCount ?? metrics.totalEntryCount),
    totalEntryCount: number(metrics.totalEntryCount ?? metrics.entryCount),
    assignedEntryCount: number(metrics.assignedEntryCount),
    scoredEntryCount: number(metrics.scoredEntryCount),
    rankedEntryCount: number(metrics.rankedEntryCount),
    responsibleJudgeCount: number(metrics.responsibleJudgeCount)
  };
}

function isResponsibleJudge(row = {}) {
  const raw = `${row.role || row.type || row.ItDescription || row.TiDescription || row.description || ''}`.toLowerCase();
  return raw.includes('respons') || raw.includes('arbitre') || raw.includes('judge') || raw.includes('chair');
}

function hasTarget(value) {
  const normalized = String(value || '').trim();
  return Boolean(normalized && normalized !== '0' && normalized !== '000');
}

function number(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

async function safeCall(fn, fallback) {
  try { return (await fn()) ?? fallback; } catch { return fallback; }
}
