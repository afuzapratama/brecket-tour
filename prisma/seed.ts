import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  demoGroups,
  demoMatches,
  demoParticipants,
  demoTournament,
  getDemoBracket,
  getDemoGroupsWithStandings,
} from "../src/lib/tournament/demo-data";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function resetDemoTournament() {
  const existing = await prisma.tournament.findUnique({
    where: { slug: demoTournament.slug },
    select: { id: true },
  });

  if (!existing) {
    return;
  }

  await prisma.tournament.delete({
    where: { id: existing.id },
  });
}

async function seedTeams() {
  const teamMap = new Map<string, string>();

  for (const participant of demoParticipants) {
    const existingTeam = await prisma.team.findFirst({
      where: { name: participant.team.name },
    });

    const team = existingTeam
      ? await prisma.team.update({
          where: { id: existingTeam.id },
          data: {
            tag: participant.team.tag,
            logoUrl: participant.team.logoUrl,
          },
        })
      : await prisma.team.create({
          data: {
            name: participant.team.name,
            tag: participant.team.tag,
            logoUrl: participant.team.logoUrl,
            country: "ID",
          },
        });

    teamMap.set(participant.id, team.id);
  }

  return teamMap;
}

async function seedTournament(teamMap: Map<string, string>) {
  const tournament = await prisma.tournament.create({
    data: {
      name: demoTournament.name,
      slug: demoTournament.slug,
      game: demoTournament.game,
      status: "live",
      region: demoTournament.region,
      startDate: new Date(demoTournament.startDate),
      rules:
        "Top 2 setiap group lolos ke single elimination playoff. Default scoring: win 3 points, draw 1 point, lose 0 point.",
    },
  });

  const participantMap = new Map<string, string>();

  for (const participant of demoParticipants) {
    const teamId = teamMap.get(participant.id);

    if (!teamId) {
      throw new Error(`Missing team for participant: ${participant.id}`);
    }

    const tournamentParticipant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: tournament.id,
        teamId,
        seed: participant.seed,
        status: "confirmed",
      },
    });

    participantMap.set(participant.id, tournamentParticipant.id);
  }

  return { tournament, participantMap };
}

async function seedGroups(
  tournamentId: string,
  participantMap: Map<string, string>,
) {
  const groupMap = new Map<string, string>();

  for (const [index, demoGroup] of demoGroups.entries()) {
    const group = await prisma.group.create({
      data: {
        tournamentId,
        name: demoGroup.name,
        sortOrder: index + 1,
        topQualifyCount: demoGroup.topQualifyCount,
        status: "live",
      },
    });

    groupMap.set(demoGroup.id, group.id);

    for (const participantId of demoGroup.participantIds) {
      const mappedParticipantId = participantMap.get(participantId);

      if (!mappedParticipantId) {
        throw new Error(`Missing participant for group: ${participantId}`);
      }

      await prisma.groupParticipant.create({
        data: {
          groupId: group.id,
          participantId: mappedParticipantId,
        },
      });
    }
  }

  return groupMap;
}

async function seedMatches(
  tournamentId: string,
  participantMap: Map<string, string>,
  groupMap: Map<string, string>,
) {
  for (const [index, demoMatch] of demoMatches.entries()) {
    const demoGroup = demoGroups.find(
      (group) =>
        demoMatch.participantAId &&
        demoMatch.participantBId &&
        group.participantIds.includes(demoMatch.participantAId) &&
        group.participantIds.includes(demoMatch.participantBId),
    );

    const match = await prisma.match.create({
      data: {
        tournamentId,
        stageType: "group",
        groupId: demoGroup ? groupMap.get(demoGroup.id) : null,
        matchNumber: index + 1,
        participantAId: demoMatch.participantAId
          ? participantMap.get(demoMatch.participantAId)
          : null,
        participantBId: demoMatch.participantBId
          ? participantMap.get(demoMatch.participantBId)
          : null,
        scoreA: demoMatch.scoreA,
        scoreB: demoMatch.scoreB,
        winnerParticipantId: demoMatch.winnerParticipantId
          ? participantMap.get(demoMatch.winnerParticipantId)
          : null,
        status: demoMatch.status,
        locked: demoMatch.status === "completed",
      },
    });

    for (const [gameIndex, game] of demoMatch.games?.entries() ?? []) {
      await prisma.matchGame.create({
        data: {
          matchId: match.id,
          gameNumber: gameIndex + 1,
          scoreA: game.scoreA,
          scoreB: game.scoreB,
          killsA: game.killsA ?? 0,
          killsB: game.killsB ?? 0,
          deathsA: game.deathsA ?? 0,
          deathsB: game.deathsB ?? 0,
          winnerParticipantId: game.winnerParticipantId
            ? participantMap.get(game.winnerParticipantId)
            : null,
        },
      });
    }
  }
}

async function seedStandings(
  tournamentId: string,
  participantMap: Map<string, string>,
  groupMap: Map<string, string>,
) {
  for (const group of getDemoGroupsWithStandings()) {
    const groupId = groupMap.get(group.id);

    if (!groupId) {
      throw new Error(`Missing group: ${group.id}`);
    }

    for (const standing of group.standings) {
      const participantId = participantMap.get(standing.participantId);

      if (!participantId) {
        throw new Error(`Missing standing participant: ${standing.participantId}`);
      }

      await prisma.standingSnapshot.create({
        data: {
          tournamentId,
          groupId,
          participantId,
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
      });
    }
  }
}

async function seedBracket(
  tournamentId: string,
  participantMap: Map<string, string>,
  groupMap: Map<string, string>,
) {
  const bracket = await prisma.bracket.create({
    data: {
      tournamentId,
      type: "single_elimination",
      status: "draft",
      generatedFromStage: "group",
    },
  });

  for (const generatedMatch of getDemoBracket()) {
    const match = await prisma.match.create({
      data: {
        tournamentId,
        bracketId: bracket.id,
        stageType: "playoff",
        roundNumber: generatedMatch.roundNumber,
        matchNumber: generatedMatch.matchNumber,
        participantAId:
          generatedMatch.slotA?.participantId &&
          generatedMatch.slotA.participantId !== "bye"
            ? participantMap.get(generatedMatch.slotA.participantId)
            : null,
        participantBId:
          generatedMatch.slotB?.participantId &&
          generatedMatch.slotB.participantId !== "bye"
            ? participantMap.get(generatedMatch.slotB.participantId)
            : null,
        status: "scheduled",
      },
    });

    for (const [slotLabel, slot] of [
      ["A", generatedMatch.slotA],
      ["B", generatedMatch.slotB],
    ] as const) {
      if (!slot) {
        continue;
      }

      await prisma.bracketSlot.create({
        data: {
          bracketId: bracket.id,
          matchId: match.id,
          slotLabel,
          sourceType: slot.participantId === "bye" ? "bye" : "group_rank",
          sourceGroupId:
            slot.sourceGroupId === "bye"
              ? null
              : groupMap.get(slot.sourceGroupId),
          sourceRank: slot.sourceRank || null,
          participantId:
            slot.participantId === "bye"
              ? null
              : participantMap.get(slot.participantId),
        },
      });
    }
  }
}

async function main() {
  await resetDemoTournament();
  const teamMap = await seedTeams();
  const { tournament, participantMap } = await seedTournament(teamMap);
  const groupMap = await seedGroups(tournament.id, participantMap);
  await seedMatches(tournament.id, participantMap, groupMap);
  await seedStandings(tournament.id, participantMap, groupMap);
  await seedBracket(tournament.id, participantMap, groupMap);

  console.log(`Seeded ${demoTournament.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
