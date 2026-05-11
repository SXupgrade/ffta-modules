export function compareStandingRows(left, right) {
  if (right.totalPoints !== left.totalPoints) {
    return right.totalPoints - left.totalPoints;
  }
  if (right.qualificationPoints !== left.qualificationPoints) {
    return right.qualificationPoints - left.qualificationPoints;
  }
  return String(left.teamName).localeCompare(String(right.teamName));
}
