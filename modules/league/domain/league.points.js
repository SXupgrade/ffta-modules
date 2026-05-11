export function getPointsForRank(pointsGrid, rank) {
  const match = pointsGrid?.find((entry) => Number(entry.rank) === Number(rank));
  return Number(match?.points ?? 0);
}

export function calculateQualificationPoints({ qualificationRank, settings }) {
  return getPointsForRank(settings.qualificationPointsGrid, qualificationRank);
}

export function calculateBracketPoints({ finalRank, settings }) {
  return getPointsForRank(settings.bracketPointsGrid, finalRank);
}

export function calculateMatchWinPoints({ wins, settings }) {
  return Number(wins ?? 0) * Number(settings.matchWinPoints ?? 0);
}
