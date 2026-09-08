export function computeFullConfirmMask(numDistances) {
  const safeCount = Math.max(0, Math.min(8, Number(numDistances) || 0));
  return Math.pow(2, safeCount + 1) - 2;
}

export function isDistanceConfirmed(quConfirm, distance) {
  const bit = Math.pow(2, Number(distance) || 0);
  return ((Number(quConfirm) || 0) & bit) !== 0;
}

export function toggleConfirmBit(quConfirm, distance, confirmed) {
  const current = Number(quConfirm) || 0;
  const bit = Math.pow(2, Number(distance) || 0);
  return confirmed ? (current | bit) : (current & ~bit);
}
