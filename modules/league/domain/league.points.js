export function getPointsForRank(pointsGrid, rank) {
  const match = pointsGrid?.find((entry) => Number(entry.rank) === Number(rank));
  return Number(match?.points ?? 0);
}

export function getCategoryPointSettings(settings, categoryKey) {
  const categorySettings = settings?.categoryPointSettings?.[categoryKey] ?? {};

  return {
    enableQualificationPoints: Boolean(categorySettings.enableQualificationPoints ?? isModeEnabled(settings, 'qualification-ranking')),
    enableMatchWinPoints: Boolean(categorySettings.enableMatchWinPoints ?? isModeEnabled(settings, 'match-wins')),
    enableBracketPoints: Boolean(categorySettings.enableBracketPoints ?? isModeEnabled(settings, 'bracket-ranking')),
    qualificationPointsGrid: Array.isArray(categorySettings.qualificationPointsGrid)
      ? categorySettings.qualificationPointsGrid
      : (settings?.qualificationPointsGrid ?? []),
    matchWinPoints: Number(categorySettings.matchWinPoints ?? settings?.matchWinPoints ?? 0),
    bracketPointsGrid: Array.isArray(categorySettings.bracketPointsGrid)
      ? categorySettings.bracketPointsGrid
      : (settings?.bracketPointsGrid ?? [])
  };
}

export function calculateQualificationPoints({ qualificationRank, settings, categoryKey }) {
  const categorySettings = getCategoryPointSettings(settings, categoryKey);
  if (!categorySettings.enableQualificationPoints) return 0;
  return getPointsForRank(categorySettings.qualificationPointsGrid, qualificationRank);
}

export function calculateBracketPoints({ finalRank, settings, categoryKey }) {
  const categorySettings = getCategoryPointSettings(settings, categoryKey);
  if (!categorySettings.enableBracketPoints) return 0;
  return getPointsForRank(categorySettings.bracketPointsGrid, finalRank);
}

export function calculateMatchWinPoints({ wins, settings, categoryKey }) {
  const categorySettings = getCategoryPointSettings(settings, categoryKey);
  if (!categorySettings.enableMatchWinPoints) return 0;
  return Number(wins ?? 0) * Number(categorySettings.matchWinPoints ?? 0);
}

function isModeEnabled(settings, mode) {
  if (!settings?.pointsMode) {
    if (mode === 'qualification-ranking') return Array.isArray(settings?.qualificationPointsGrid);
    if (mode === 'match-wins') return Number(settings?.matchWinPoints ?? 0) > 0;
    if (mode === 'bracket-ranking') return Array.isArray(settings?.bracketPointsGrid);
  }
  const pointsMode = settings?.pointsMode ?? 'qualification-ranking';
  if (pointsMode === 'combined') return true;
  if (mode === 'qualification-ranking') return pointsMode === 'qualification-ranking';
  if (mode === 'match-wins') return pointsMode === 'match-wins';
  if (mode === 'bracket-ranking') return pointsMode === 'bracket-ranking';
  return false;
}
