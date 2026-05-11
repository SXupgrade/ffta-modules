import { MATCH_POINTS_MODE } from './constants/points.constants.js';
import { validateLeagueInput } from './league.validation.js';
import { calculateBracketPoints, calculateMatchWinPoints, calculateQualificationPoints } from './league.points.js';
import { createGroupKey } from './league.mapping.js';
import { compareStandingRows } from './league.tiebreaks.js';

export function createLeagueCalculator() {
  return {
    calculateStandings(input) {
      return calculateLeagueStandings(input);
    }
  };
}

export function calculateLeagueStandings(input) {
  const warnings = validateLeagueInput(input);
  const groupsByKey = new Map();

  for (const team of input.teams ?? []) {
    const groupKey = createGroupKey(team);
    if (!groupsByKey.has(groupKey)) {
      groupsByKey.set(groupKey, {
        groupKey,
        division: team.division,
        className: team.className,
        rowsByTeam: new Map()
      });
    }

    const group = groupsByKey.get(groupKey);
    group.rowsByTeam.set(team.teamCode, {
      teamCode: team.teamCode,
      teamName: team.teamName,
      division: team.division,
      className: team.className,
      qualificationPoints: 0,
      matchPoints: 0,
      bracketPoints: 0,
      totalPoints: 0,
      rounds: []
    });
  }

  for (const round of input.rounds ?? []) {
    applyRoundPoints({ input, round, groupsByKey });
  }

  const groups = Array.from(groupsByKey.values()).map((group) => {
    const rows = Array.from(group.rowsByTeam.values())
      .map((row) => ({ ...row, totalPoints: row.qualificationPoints + row.matchPoints + row.bracketPoints }))
      .sort(compareStandingRows)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    return {
      groupKey: group.groupKey,
      division: group.division,
      className: group.className,
      rows
    };
  });

  return {
    groups,
    warnings,
    calculatedAt: new Date().toISOString()
  };
}

function applyRoundPoints({ input, round, groupsByKey }) {
  const settings = input.settings;
  const qualificationRows = (input.qualificationResults ?? []).filter((item) => item.roundCode === round.code);
  const matchRows = (input.matchResults ?? []).filter((item) => item.roundCode === round.code);

  for (const qualificationRow of qualificationRows) {
    const group = groupsByKey.get(createGroupKey(qualificationRow));
    const standingRow = group?.rowsByTeam.get(qualificationRow.teamCode);
    if (!standingRow) continue;

    const points = calculateQualificationPoints({ qualificationRank: qualificationRow.rank, settings });
    standingRow.qualificationPoints += points;
    upsertRoundDetail(standingRow, round.code).qualificationPoints = points;
  }

  for (const matchRow of matchRows) {
    const group = groupsByKey.get(createGroupKey(matchRow));
    const standingRow = group?.rowsByTeam.get(matchRow.teamCode);
    if (!standingRow) continue;

    const roundDetail = upsertRoundDetail(standingRow, round.code);

    if (settings.matchPointsMode === MATCH_POINTS_MODE.BRACKET_FINAL_RANKING) {
      const points = calculateBracketPoints({ finalRank: matchRow.finalRank, settings });
      standingRow.bracketPoints += points;
      roundDetail.bracketPoints = points;
    } else {
      const points = calculateMatchWinPoints({ wins: matchRow.wins, settings });
      standingRow.matchPoints += points;
      roundDetail.matchPoints = points;
    }
  }
}

function upsertRoundDetail(standingRow, roundCode) {
  let detail = standingRow.rounds.find((item) => item.roundCode === roundCode);
  if (!detail) {
    detail = { roundCode, qualificationPoints: 0, matchPoints: 0, bracketPoints: 0 };
    standingRow.rounds.push(detail);
  }
  return detail;
}
