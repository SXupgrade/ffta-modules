export function createResultLine(input = {}) {
  return [
    input.level ?? '',
    input.tournamentCode ?? '',
    input.license ?? '',
    input.lastName ?? '',
    input.firstName ?? '',
    input.clubCode ?? '',
    input.division ?? '',
    input.classCode ?? '',
    String(input.score ?? ''),
    String(input.rank ?? '')
  ];
}
