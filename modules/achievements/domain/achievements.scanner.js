export async function scanAchievementMetrics({ data } = {}) {
  const tournament = await safeCall(() => data?.tournament?.getCurrent?.({ moduleId: 'achievements' }), null);
  const entries = await safeCall(() => data?.entries?.list?.({}, { moduleId: 'achievements' }), []);
  const scores = await safeCall(() => data?.scores?.readQualificationScores?.({}, { moduleId: 'achievements' }), []);
  const targets = await safeCall(() => data?.targets?.list?.({}, { moduleId: 'achievements' }), []);

  return buildMetrics({ tournament, entries, scores, targets });
}

export function buildMetrics({ tournament = null, entries = [], scores = [], targets = [] } = {}) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const safeScores = Array.isArray(scores) ? scores : [];
  const safeTargets = Array.isArray(targets) ? targets : [];
  const assignedEntryCount = safeEntries.filter((entry) => hasTarget(entry.target || entry.targetNo || entry.quTargetNo)).length;
  const scoredEntryCount = safeScores.filter((score) => Number(score.score || score.total || score.quScore || 0) > 0).length;
  const rankedEntryCount = safeScores.filter((score) => Number(score.rank || score.quRank || score.quClRank || 0) > 0).length;
  const sessions = new Set(safeEntries.map((entry) => entry.session || entry.sesOrder).filter(Boolean));
  const divisions = new Set(safeEntries.map((entry) => entry.division || entry.enDivision).filter(Boolean));
  const targetCount = safeTargets.length || new Set(safeEntries.map((entry) => normalizeTarget(entry.target || entry.targetNo || entry.quTargetNo)).filter(Boolean)).size;
  const entryCount = safeEntries.length;

  return {
    scannedAt: new Date().toISOString(),
    tournamentCount: tournament ? 1 : 0,
    tournamentName: tournament?.name || tournament?.ToName || tournament?.title || '',
    entryCount,
    assignedEntryCount,
    scoredEntryCount,
    rankedEntryCount,
    targetCount,
    sessionCount: sessions.size || Number(tournament?.sessions || tournament?.ToNumSession || 0),
    divisionCount: divisions.size,
    fieldCompletionPercent: entryCount ? Math.round((assignedEntryCount / entryCount) * 100) : 0
  };
}

function hasTarget(value) {
  const normalized = normalizeTarget(value);
  return Boolean(normalized && normalized !== '0' && normalized !== '000');
}

function normalizeTarget(value) {
  return String(value || '').trim();
}

async function safeCall(fn, fallback) {
  try {
    const result = await fn();
    return result ?? fallback;
  } catch {
    return fallback;
  }
}
