import type {
  MatchResult,
  Participant,
  ScoringConfig,
  StandingRow,
  TiebreakerKey,
} from "@/lib/tournament/types";
import {
  defaultScoringConfig,
  defaultTiebreakers,
} from "@/lib/tournament/types";

function createEmptyRow(participantId: string): StandingRow {
  return {
    participantId,
    rank: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    mapWins: 0,
    mapLosses: 0,
    mapDiff: 0,
    kills: 0,
    deaths: 0,
    killDiff: 0,
    kdRatio: 0,
  };
}

function addPoints(row: StandingRow, points: number) {
  row.points += points;
}

function resolveWinner(match: MatchResult) {
  if (match.winnerParticipantId) {
    return match.winnerParticipantId;
  }

  if (match.scoreA == null || match.scoreB == null) {
    return null;
  }

  if (match.scoreA === match.scoreB) {
    return "draw";
  }

  return match.scoreA > match.scoreB
    ? match.participantAId ?? null
    : match.participantBId ?? null;
}

function applyGameStats(match: MatchResult, rowA: StandingRow, rowB: StandingRow) {
  if (!match.games?.length) {
    const scoreA = match.scoreA ?? 0;
    const scoreB = match.scoreB ?? 0;

    rowA.mapWins += scoreA;
    rowA.mapLosses += scoreB;
    rowB.mapWins += scoreB;
    rowB.mapLosses += scoreA;
    return;
  }

  match.games.forEach((game) => {
    const scoreA = game.scoreA ?? 0;
    const scoreB = game.scoreB ?? 0;

    rowA.mapWins += scoreA > scoreB ? 1 : 0;
    rowA.mapLosses += scoreB > scoreA ? 1 : 0;
    rowB.mapWins += scoreB > scoreA ? 1 : 0;
    rowB.mapLosses += scoreA > scoreB ? 1 : 0;

    rowA.kills += game.killsA ?? 0;
    rowA.deaths += game.deathsA ?? 0;
    rowB.kills += game.killsB ?? 0;
    rowB.deaths += game.deathsB ?? 0;
  });
}

function compareByTiebreakers(
  a: StandingRow,
  b: StandingRow,
  participants: Participant[],
  tiebreakers: TiebreakerKey[],
) {
  for (const key of tiebreakers) {
    if (key === "points" && a.points !== b.points) {
      return b.points - a.points;
    }

    if (key === "wins" && a.wins !== b.wins) {
      return b.wins - a.wins;
    }

    if (key === "map_diff" && a.mapDiff !== b.mapDiff) {
      return b.mapDiff - a.mapDiff;
    }

    if (key === "kill_diff" && a.killDiff !== b.killDiff) {
      return b.killDiff - a.killDiff;
    }

    if (key === "total_kills" && a.kills !== b.kills) {
      return b.kills - a.kills;
    }

    if (key === "manual_seed") {
      const seedA =
        participants.find((participant) => participant.id === a.participantId)
          ?.seed ?? Number.MAX_SAFE_INTEGER;
      const seedB =
        participants.find((participant) => participant.id === b.participantId)
          ?.seed ?? Number.MAX_SAFE_INTEGER;

      if (seedA !== seedB) {
        return seedA - seedB;
      }
    }
  }

  return a.participantId.localeCompare(b.participantId);
}

export function calculateStandings(
  participants: Participant[],
  matches: MatchResult[],
  scoringConfig: Partial<ScoringConfig> = {},
  tiebreakers: TiebreakerKey[] = defaultTiebreakers,
) {
  const config = { ...defaultScoringConfig, ...scoringConfig };
  const rows = new Map<string, StandingRow>();

  participants.forEach((participant) => {
    rows.set(participant.id, createEmptyRow(participant.id));
  });

  matches
    .filter((match) => match.status === "completed")
    .forEach((match) => {
      if (!match.participantAId || !match.participantBId) {
        return;
      }

      const rowA = rows.get(match.participantAId);
      const rowB = rows.get(match.participantBId);

      if (!rowA || !rowB) {
        return;
      }

      const winner = resolveWinner(match);

      rowA.played += 1;
      rowB.played += 1;

      applyGameStats(match, rowA, rowB);

      if (winner === "draw") {
        rowA.draws += 1;
        rowB.draws += 1;
        addPoints(rowA, config.drawPoints);
        addPoints(rowB, config.drawPoints);
      } else if (winner === match.participantAId) {
        rowA.wins += 1;
        rowB.losses += 1;
        addPoints(rowA, config.winPoints);
        addPoints(rowB, config.lossPoints);
      } else if (winner === match.participantBId) {
        rowB.wins += 1;
        rowA.losses += 1;
        addPoints(rowB, config.winPoints);
        addPoints(rowA, config.lossPoints);
      }
    });

  const sorted = [...rows.values()].map((row) => {
    const mapDiff = row.mapWins - row.mapLosses;
    const killDiff = row.kills - row.deaths;
    const kdRatio = row.deaths === 0 ? row.kills : row.kills / row.deaths;

    return {
      ...row,
      mapDiff,
      killDiff,
      kdRatio: Number(kdRatio.toFixed(2)),
    };
  });

  sorted.sort((a, b) =>
    compareByTiebreakers(a, b, participants, tiebreakers),
  );

  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}
