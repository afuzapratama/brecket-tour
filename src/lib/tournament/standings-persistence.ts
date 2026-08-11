import { prisma } from "@/lib/db";
import { calculateStandings } from "@/lib/tournament/standings";
import type { MatchResult, Participant } from "@/lib/tournament/types";

export async function recalculateGroupStandings(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      participants: {
        include: {
          participant: {
            include: { team: true },
          },
        },
      },
      matches: {
        where: { stageType: "group" },
        include: { games: true },
      },
    },
  });

  if (!group) {
    return;
  }

  const participants: Participant[] = group.participants.map((entry) => ({
    id: entry.participant.id,
    seed: entry.participant.seed,
    team: {
      name: entry.participant.team.name,
      tag: entry.participant.team.tag,
      logoUrl: entry.participant.team.logoUrl,
    },
  }));

  const matches: MatchResult[] = group.matches.map((match) => ({
    id: match.id,
    participantAId: match.participantAId,
    participantBId: match.participantBId,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    winnerParticipantId: match.winnerParticipantId,
    status: match.status,
    games: match.games.map((game) => ({
      scoreA: game.scoreA,
      scoreB: game.scoreB,
      killsA: game.killsA,
      killsB: game.killsB,
      deathsA: game.deathsA,
      deathsB: game.deathsB,
      winnerParticipantId: game.winnerParticipantId,
    })),
  }));

  const standings = calculateStandings(participants, matches);

  await prisma.$transaction([
    prisma.standingSnapshot.deleteMany({
      where: { groupId },
    }),
    ...standings.map((standing) =>
      prisma.standingSnapshot.create({
        data: {
          tournamentId: group.tournamentId,
          groupId,
          participantId: standing.participantId,
          rank: standing.rank,
          played: standing.played,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          points: standing.points,
          mapWins: standing.mapWins,
          mapLosses: standing.mapLosses,
          mapDiff: standing.mapDiff,
          kills: standing.kills,
          deaths: standing.deaths,
          killDiff: standing.killDiff,
          kdRatio: standing.kdRatio,
        },
      }),
    ),
  ]);
}
