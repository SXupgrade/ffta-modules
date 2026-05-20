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
      categoryKey: groupKey,
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
  const settings = input.settings ?? {};
  const qualificationRows = (input.qualificationResults ?? []).filter((item) => item.roundCode === round.code);
  const matchRows = (input.matchResults ?? []).filter((item) => item.roundCode === round.code);

  for (const qualificationRow of qualificationRows) {
    const groupKey = createGroupKey(qualificationRow);
    const group = groupsByKey.get(groupKey);
    const standingRow = group?.rowsByTeam.get(qualificationRow.teamCode);
    if (!standingRow) continue;

    const points = calculateQualificationPoints({
      qualificationRank: qualificationRow.rank,
      settings,
      categoryKey: groupKey
    });
    standingRow.qualificationPoints += points;

    const roundDetail = upsertRoundDetail(standingRow, round.code);
    roundDetail.qualificationRank = qualificationRow.rank ?? null;
    roundDetail.qualificationScore = qualificationRow.score ?? null;
    roundDetail.qualificationPoints = points;
    updateTotalRoundPoints(roundDetail);
  }

  for (const matchRow of matchRows) {
    const groupKey = createGroupKey(matchRow);
    const group = groupsByKey.get(groupKey);
    const standingRow = group?.rowsByTeam.get(matchRow.teamCode);
    if (!standingRow) continue;

    const roundDetail = upsertRoundDetail(standingRow, round.code);

    if (matchRow.wins !== null && matchRow.wins !== undefined) {
      const points = calculateMatchWinPoints({ wins: matchRow.wins, settings, categoryKey: groupKey });
      standingRow.matchPoints += points;
      roundDetail.matchWins = matchRow.wins;
      roundDetail.matchPoints = points;
    }

    if (matchRow.finalRank !== null && matchRow.finalRank !== undefined) {
      const points = calculateBracketPoints({ finalRank: matchRow.finalRank, settings, categoryKey: groupKey });
      standingRow.bracketPoints += points;
      roundDetail.finalRank = matchRow.finalRank;
      roundDetail.bracketPoints = points;
    }

    updateTotalRoundPoints(roundDetail);
  }
}

function upsertRoundDetail(standingRow, roundCode) {
  let detail = standingRow.rounds.find((item) => item.roundCode === roundCode);
  if (!detail) {
    detail = {
      roundCode,
      qualificationRank: null,
      qualificationScore: null,
      qualificationPoints: 0,
      matchWins: 0,
      matchPoints: 0,
      finalRank: null,
      bracketPoints: 0,
      totalRoundPoints: 0
    };
    standingRow.rounds.push(detail);
  }
  return detail;
}

function updateTotalRoundPoints(detail) {
  detail.totalRoundPoints = Number(detail.qualificationPoints ?? 0)
    + Number(detail.matchPoints ?? 0)
    + Number(detail.bracketPoints ?? 0);
}
