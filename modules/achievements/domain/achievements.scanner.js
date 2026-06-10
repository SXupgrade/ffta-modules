export async function scanAchievementMetrics({ data } = {}) {
  const scanned = await safeCall(() => data?.request?.('scanOrganizerAchievements', {}, { moduleId: 'achievements' }), null);
  if (scanned && typeof scanned === 'object') {
    return normalizeMetrics(scanned);
  }

  const tournament = await safeCall(() => data?.tournament?.getCurrent?.({ moduleId: 'achievements' }), null);
  const entries = await safeCall(() => data?.entries?.list?.({}, { moduleId: 'achievements' }), []);
  const scores = await safeCall(() => data?.scores?.readQualificationScores?.({}, { moduleId: 'achievements' }), []);
  const targets = await safeCall(() => data?.targets?.list?.({}, { moduleId: 'achievements' }), []);

  return buildMetrics({ tournaments: tournament ? [tournament] : [], entries, scores, targets });
}

export function buildMetrics({ tournament = null, tournaments = null, entries = [], scores = [], targets = [] } = {}) {
  const safeTournaments = Array.isArray(tournaments) ? tournaments : (tournament ? [tournament] : []);
  const safeEntries = Array.isArray(entries) ? entries : [];
  const safeScores = Array.isArray(scores) ? scores : [];
  const safeTargets = Array.isArray(targets) ? targets : [];
  const entriesByTournament = groupByTournament(safeEntries);
  const scoresByTournament = groupByTournament(safeScores);
  const targetGroups = new Set();
  const sessionsByTournament = new Map();
  const divisionsByTournament = new Map();
  const clubsByTournament = new Map();
  let assignedEntryCount = 0;

  for (const entry of safeEntries) {
    const tourId = getTournamentId(entry);
    const target = normalizeTarget(entry.target || entry.targetNo || entry.quTargetNo);
    const session = entry.session || entry.sesOrder || entry.QuSession;
    if (hasTarget(target)) {
      assignedEntryCount += 1;
      targetGroups.add(`${tourId}|${session || ''}|${target}`);
    }
    addToMapSet(sessionsByTournament, tourId, session);
    addToMapSet(divisionsByTournament, tourId, entry.division || entry.enDivision || entry.EnDivision);
    addToMapSet(clubsByTournament, tourId, entry.clubCode || entry.country || entry.enCountry || entry.EnCountry);
  }

  for (const target of safeTargets) {
    const tourId = getTournamentId(target);
    const targetNo = normalizeTarget(target.target || target.targetNo || target.quTargetNo);
    const session = target.session || target.sesOrder || target.QuSession;
    if (hasTarget(targetNo)) targetGroups.add(`${tourId}|${session || ''}|${targetNo}`);
  }

  const scoredEntryCount = safeScores.filter((score) => Number(score.score || score.total || score.quScore || score.QuScore || 0) > 0).length;
  const rankedEntryCount = safeScores.filter((score) => Number(score.rank || score.quRank || score.quClRank || score.QuClRank || 0) > 0).length;
  const tournamentIds = new Set([
    ...safeTournaments.map(getTournamentId),
    ...safeEntries.map(getTournamentId),
    ...safeScores.map(getTournamentId)
  ].filter(Boolean));
  const tournamentCount = tournamentIds.size || safeTournaments.length || (safeEntries.length ? 1 : 0);
  const currentTournament = safeTournaments[0] || tournament || null;
  const completedFieldPlanCount = Array.from(entriesByTournament.entries()).filter(([tourId, rows]) => {
    if (!rows.length) return false;
    return rows.every((entry) => hasTarget(entry.target || entry.targetNo || entry.quTargetNo));
  }).length;

  return normalizeMetrics({
    scannedAt: new Date().toISOString(),
    scanScope: tournamentCount > 1 ? 'all' : 'current',
    tournamentCount,
    tournamentCount2026: countTournamentsByYear(safeTournaments, 2026),
    tournamentName: currentTournament?.name || currentTournament?.ToName || currentTournament?.title || currentTournament?.code || '',
    totalEntryCount: safeEntries.length,
    entryCount: safeEntries.length,
    maxEntriesInTournament: maxMapGroupSize(entriesByTournament),
    assignedEntryCount,
    scoredEntryCount,
    rankedEntryCount,
    targetCount: safeTargets.length || targetGroups.size,
    maxSessionCount: maxMapSetSize(sessionsByTournament),
    sessionCount: maxMapSetSize(sessionsByTournament) || Number(currentTournament?.sessions || currentTournament?.ToNumSession || 0),
    multiSessionTournamentCount: Array.from(sessionsByTournament.values()).filter((set) => set.size >= 2).length,
    maxDivisionCount: maxMapSetSize(divisionsByTournament),
    divisionCount: maxMapSetSize(divisionsByTournament),
    maxClubCount: maxMapSetSize(clubsByTournament),
    completedFieldPlanCount,
    fieldCompletionPercent: safeEntries.length ? Math.round((assignedEntryCount / safeEntries.length) * 100) : 0,
    scoredTournamentCount: Array.from(scoresByTournament.values()).filter((rows) => rows.some((score) => Number(score.score || score.total || score.quScore || score.QuScore || 0) > 0)).length
  });
}

function normalizeMetrics(metrics = {}) {
  return {
    scannedAt: metrics.scannedAt || new Date().toISOString(),
    scanScope: metrics.scanScope || 'all',
    tournamentCount: number(metrics.tournamentCount),
    tournamentCount2026: number(metrics.tournamentCount2026),
    tournamentName: metrics.tournamentName || '',
    totalEntryCount: number(metrics.totalEntryCount ?? metrics.entryCount),
    entryCount: number(metrics.entryCount ?? metrics.totalEntryCount),
    maxEntriesInTournament: number(metrics.maxEntriesInTournament ?? metrics.entryCount),
    assignedEntryCount: number(metrics.assignedEntryCount),
    scoredEntryCount: number(metrics.scoredEntryCount),
    rankedEntryCount: number(metrics.rankedEntryCount),
    targetCount: number(metrics.targetCount),
    sessionCount: number(metrics.sessionCount),
    maxSessionCount: number(metrics.maxSessionCount ?? metrics.sessionCount),
    multiSessionTournamentCount: number(metrics.multiSessionTournamentCount),
    divisionCount: number(metrics.divisionCount),
    maxDivisionCount: number(metrics.maxDivisionCount ?? metrics.divisionCount),
    maxClubCount: number(metrics.maxClubCount),
    completedFieldPlanCount: number(metrics.completedFieldPlanCount),
    fieldCompletionPercent: number(metrics.fieldCompletionPercent),
    scoredTournamentCount: number(metrics.scoredTournamentCount)
  };
}

function groupByTournament(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const key = getTournamentId(row) || 'current';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function getTournamentId(row = {}) {
  return String(row.tournamentId || row.tournament || row.EnTournament || row.ToId || row.id || '').trim();
}

function countTournamentsByYear(tournaments, year) {
  return (tournaments || []).filter((item) => {
    const rawDate = item.dateFrom || item.whenFrom || item.ToWhenFrom || item.startDate || item.startsAt || '';
    return String(rawDate).startsWith(String(year));
  }).length;
}

function addToMapSet(map, key, value) {
  const normalizedKey = key || 'current';
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return;
  if (!map.has(normalizedKey)) map.set(normalizedKey, new Set());
  map.get(normalizedKey).add(normalizedValue);
}

function maxMapSetSize(map) {
  return Math.max(0, ...Array.from(map.values()).map((set) => set.size));
}

function maxMapGroupSize(map) {
  return Math.max(0, ...Array.from(map.values()).map((rows) => rows.length));
}

function hasTarget(value) {
  const normalized = normalizeTarget(value);
  return Boolean(normalized && normalized !== '0' && normalized !== '000');
}

function normalizeTarget(value) {
  return String(value || '').trim();
}

function number(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

async function safeCall(fn, fallback) {
  try {
    const result = await fn();
    return result ?? fallback;
  } catch {
    return fallback;
  }
}
