export const BEURSAULT_MAX_ARROWS = 40;

export function normalizeZoneCount(value) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < 0) return 0;
  return number;
}

export function computeBeursaultScore({ ones = 0, twos = 0, threes = 0, fours = 0 }) {
  const normalized = {
    ones: normalizeZoneCount(ones),
    twos: normalizeZoneCount(twos),
    threes: normalizeZoneCount(threes),
    fours: normalizeZoneCount(fours)
  };
  const honours = normalized.ones + normalized.twos + normalized.threes + normalized.fours;
  const points = normalized.ones + normalized.twos * 2 + normalized.threes * 3 + normalized.fours * 4;

  return {
    ...normalized,
    honours,
    points,
    valid: honours >= 0 && honours <= BEURSAULT_MAX_ARROWS
  };
}

export function deriveZoneCountsFromIanseo(row) {
  const honours = normalizeZoneCount(row.honours);
  const points = normalizeZoneCount(row.points);
  const fours = normalizeZoneCount(row.fours);
  const threes = normalizeZoneCount(row.threes);
  const twos = points - (4 * fours) - (3 * threes) - (honours - fours - threes);
  const ones = honours - fours - threes - twos;

  if (ones < 0 || twos < 0) {
    return { ones: '', twos: '', threes, fours, honours, points, valid: false };
  }

  return { ones, twos, threes, fours, honours, points, valid: honours <= BEURSAULT_MAX_ARROWS };
}
