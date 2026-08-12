import { prisma } from "@/lib/db";
import {
  demoGroups,
  demoMatches,
  demoParticipants,
  demoTournament,
  getDemoBracket,
  getDemoGroupsWithStandings,
  getParticipant,
} from "@/lib/tournament/demo-data";
import { teamLogoIconCount } from "@/components/team-logo";

type OverviewParticipant = {
  id: string;
  seed?: number | null;
  team: {
    name: string;
    tag?: string | null;
    logoUrl?: string | null;
    iconKey?: number | null;
  };
};

type OverviewMatch = {
  id: string;
  stageType: string;
  groupId?: string | null;
  groupName?: string | null;
  roundNumber?: number | null;
  matchNumber: number;
  status: string;
  scheduledAt?: Date | null;
  scoreA?: number | null;
  scoreB?: number | null;
  bestOf: number;
  killsA?: number | null;
  killsB?: number | null;
  participantA?: OverviewParticipant | null;
  participantB?: OverviewParticipant | null;
  winnerParticipantId?: string | null;
};

type OverviewStanding = {
  participantId: string;
  rank: number;
  played: number;
  wins: number;
  losses: number;
  points: number;
  mapDiff: number;
  killDiff: number;
  tm: number;
  participant?: OverviewParticipant | null;
};

type OverviewGroupParticipant = {
  id: string;
  tm: number;
  participant: OverviewParticipant;
};

export type TournamentOverview = {
  source: "database" | "demo";
  tournament: {
    id: string;
    name: string;
    slug: string;
    game: string;
    status: string;
    region?: string | null;
    rules?: string | null;
    thirdPlaceEnabled?: boolean;
  };
  participants: OverviewParticipant[];
  groups: Array<{
    id: string;
    name: string;
    topQualifyCount: number;
    matchCount: number;
    completedMatchCount: number;
    isReadyForPlayoff: boolean;
    participants: OverviewGroupParticipant[];
    standings: OverviewStanding[];
  }>;
  matches: OverviewMatch[];
  bracket: Array<{
    id: string;
    roundNumber: number;
    matchNumber: number;
    status?: string;
    scheduledAt?: Date | null;
    scoreA?: number | null;
    scoreB?: number | null;
    bestOf: number;
    participantA?: OverviewParticipant | null;
    participantB?: OverviewParticipant | null;
    winnerParticipantId?: string | null;
  }>;
  thirdPlaceMatch?: {
    id: string;
    roundNumber: number;
    matchNumber: number;
    status?: string;
    scheduledAt?: Date | null;
    scoreA?: number | null;
    scoreB?: number | null;
    bestOf: number;
    participantA?: OverviewParticipant | null;
    participantB?: OverviewParticipant | null;
    winnerParticipantId?: string | null;
  } | null;
  playoffPreview: Array<{
    id: string;
    roundNumber: number;
    matchNumber: number;
  }>;
};

function buildTbdPlayoffPreview(qualifierCount: number) {
  if (qualifierCount < 2) {
    return [];
  }

  let bracketSize = 1;

  while (bracketSize < qualifierCount) {
    bracketSize *= 2;
  }

  const totalRounds = Math.log2(bracketSize);
  const matches: Array<{
    id: string;
    roundNumber: number;
    matchNumber: number;
  }> = [];

  for (let round = 1; round <= totalRounds; round += 1) {
    const matchCount = bracketSize / 2 ** round;

    for (let matchNumber = 1; matchNumber <= matchCount; matchNumber += 1) {
      matches.push({
        id: `preview-${round}-${matchNumber}`,
        roundNumber: round,
        matchNumber,
      });
    }
  }

  return matches;
}

function participantFromDemo(participantId?: string | null) {
  return getParticipant(participantId) ?? null;
}

function addDemoIconKeys(participant: OverviewParticipant | null) {
  if (!participant) {
    return null;
  }

  const index = demoParticipants.findIndex(
    (demoParticipant) => demoParticipant.id === participant.id,
  );

  return {
    ...participant,
    team: {
      ...participant.team,
      iconKey: index >= 0 ? index % teamLogoIconCount : null,
    },
  };
}

function getDemoOverview(): TournamentOverview {
  return {
    source: "demo",
    tournament: demoTournament,
    participants: demoParticipants.map((participant, index) => ({
      ...participant,
      team: {
        ...participant.team,
        iconKey: index % teamLogoIconCount,
      },
    })),
    groups: getDemoGroupsWithStandings().map((group) => ({
      id: group.id,
      name: group.name,
      topQualifyCount: group.topQualifyCount,
      matchCount: group.matches.length,
      completedMatchCount: group.matches.filter(
        (match) => match.status === "completed",
      ).length,
      isReadyForPlayoff:
        group.matches.length > 0 &&
        group.matches.every((match) => match.status === "completed") &&
        group.standings.length >= group.topQualifyCount,
      participants: group.participants.map((participant) => ({
        id: `${group.id}-${participant.id}`,
        tm: 0,
        participant: addDemoIconKeys(participant) ?? participant,
      })),
      standings: group.standings.map((standing) => ({
        participantId: standing.participantId,
        rank: standing.rank,
        played: standing.played,
        wins: standing.wins,
        losses: standing.losses,
        points: standing.points,
        mapDiff: standing.mapDiff,
        killDiff: standing.killDiff,
        tm: 0,
        participant: addDemoIconKeys(participantFromDemo(standing.participantId)),
      })),
    })),
    matches: demoMatches.map((match) => ({
      id: match.id,
      stageType: "group",
      groupId: null,
      groupName: null,
      roundNumber: null,
      matchNumber: 1,
      status: match.status,
      scheduledAt: null,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      bestOf: 1,
      killsA: match.games?.[0]?.killsA ?? null,
      killsB: match.games?.[0]?.killsB ?? null,
      participantA: addDemoIconKeys(participantFromDemo(match.participantAId)),
      participantB: addDemoIconKeys(participantFromDemo(match.participantBId)),
      winnerParticipantId: match.winnerParticipantId,
    })),
    bracket: getDemoBracket().map((match) => ({
      id: `${match.roundNumber}-${match.matchNumber}`,
      roundNumber: match.roundNumber,
      matchNumber: match.matchNumber,
      status: "scheduled",
      scheduledAt: null,
      scoreA: null,
      scoreB: null,
      bestOf: match.roundNumber === 2 && match.matchNumber === 1 ? 5 : 3,
      participantA: addDemoIconKeys(participantFromDemo(match.slotA?.participantId)),
      participantB: addDemoIconKeys(participantFromDemo(match.slotB?.participantId)),
      winnerParticipantId: null,
    })),
    thirdPlaceMatch: null,
    playoffPreview: buildTbdPlayoffPreview(
      demoGroups.reduce((total, group) => total + group.topQualifyCount, 0),
    ),
  };
}

export async function getTournamentOverview(
  slug = "esport-merdeka-invitational",
): Promise<TournamentOverview> {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { slug },
      include: {
        participants: {
          include: { team: true },
          orderBy: [{ seed: "asc" }, { createdAt: "asc" }],
        },
        groups: {
          orderBy: { sortOrder: "asc" },
          include: {
            participants: {
              include: {
            participant: {
              include: { team: true },
            },
              },
              orderBy: { participant: { seed: "asc" } },
            },
            matches: {
              where: { stageType: "group" },
              select: { id: true, status: true },
            },
            standings: {
              orderBy: { rank: "asc" },
              include: {
                participant: {
                  include: { team: true },
                },
              },
            },
          },
        },
        matches: {
          orderBy: [
            { stageType: "asc" },
            { roundNumber: "asc" },
            { matchNumber: "asc" },
          ],
          include: {
            group: true,
            participantA: { include: { team: true } },
            participantB: { include: { team: true } },
            games: {
              where: { gameNumber: 1 },
              take: 1,
            },
          },
        },
      },
    });

    if (!tournament) {
      return getDemoOverview();
    }

    const playoffMatches = tournament.matches.filter(
      (match) => match.stageType === "playoff",
    );
    const participantIconKeys = new Map(
      tournament.participants.map((participant, index) => [
        participant.id,
        index % teamLogoIconCount,
      ]),
    );

    const playoffPreview = buildTbdPlayoffPreview(
      tournament.groups.reduce(
        (total, group) => total + group.topQualifyCount,
        0,
      ),
    );
    const groupEntryTm = new Map(
      tournament.groups.flatMap((group) =>
        group.participants.map((entry) => [
          `${group.id}:${entry.participantId}`,
          entry.tm,
        ]),
      ),
    );
    const finalRound = Math.max(
      0,
      ...playoffMatches.map((match) => match.roundNumber ?? 0),
    );
    const thirdPlaceMatch = playoffMatches.find(
      (match) =>
        (match.roundNumber ?? 0) === finalRound && match.matchNumber === 2,
    );
    const mainPlayoffMatches = playoffMatches.filter(
      (match) => match.id !== thirdPlaceMatch?.id,
    );

    const mapPlayoffMatch = (match: (typeof playoffMatches)[number]) => ({
      id: match.id,
      roundNumber: match.roundNumber ?? 1,
      matchNumber: match.matchNumber,
      status: match.status,
      scheduledAt: match.scheduledAt,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      bestOf: match.bestOf,
      participantA: match.participantA
        ? {
            id: match.participantA.id,
            seed: match.participantA.seed,
            team: {
          name: match.participantA.team.name,
          tag: match.participantA.team.tag,
          logoUrl: match.participantA.team.logoUrl,
          iconKey: participantIconKeys.get(match.participantA.id),
        },
      }
        : null,
      participantB: match.participantB
        ? {
            id: match.participantB.id,
            seed: match.participantB.seed,
            team: {
          name: match.participantB.team.name,
          tag: match.participantB.team.tag,
          logoUrl: match.participantB.team.logoUrl,
          iconKey: participantIconKeys.get(match.participantB.id),
        },
      }
        : null,
      winnerParticipantId: match.winnerParticipantId,
    });

    return {
      source: "database",
      tournament: {
        id: tournament.id,
        name: tournament.name,
        slug: tournament.slug,
        game: tournament.game,
        status: tournament.status,
        region: tournament.region,
        rules: tournament.rules,
        thirdPlaceEnabled: tournament.thirdPlaceEnabled,
      },
      participants: tournament.participants.map((participant) => ({
        id: participant.id,
        seed: participant.seed,
        team: {
          name: participant.team.name,
          tag: participant.team.tag,
          logoUrl: participant.team.logoUrl,
          iconKey: participantIconKeys.get(participant.id),
        },
      })),
      groups: tournament.groups.map((group) => ({
        id: group.id,
        name: group.name,
        topQualifyCount: group.topQualifyCount,
        matchCount: group.matches.length,
        completedMatchCount: group.matches.filter(
          (match) => match.status === "completed",
        ).length,
        isReadyForPlayoff:
          group.matches.length > 0 &&
          group.matches.every((match) => match.status === "completed") &&
          group.standings.length >= group.topQualifyCount,
        participants: group.participants.map((entry) => ({
          id: entry.id,
          tm: entry.tm,
          participant: {
            id: entry.participant.id,
            seed: entry.participant.seed,
              team: {
                name: entry.participant.team.name,
                tag: entry.participant.team.tag,
                logoUrl: entry.participant.team.logoUrl,
                iconKey: participantIconKeys.get(entry.participant.id),
              },
            },
          })),
        standings: group.standings.map((standing) => ({
          participantId: standing.participantId,
          rank: standing.rank,
          played: standing.played,
          wins: standing.wins,
          losses: standing.losses,
          points: standing.points,
          mapDiff: standing.mapDiff,
          killDiff: standing.killDiff,
          tm: groupEntryTm.get(`${group.id}:${standing.participantId}`) ?? 0,
          participant: standing.participant
            ? {
                id: standing.participant.id,
                seed: standing.participant.seed,
                team: {
                  name: standing.participant.team.name,
                  tag: standing.participant.team.tag,
                  logoUrl: standing.participant.team.logoUrl,
                  iconKey: participantIconKeys.get(standing.participant.id),
                },
              }
            : null,
        })),
      })),
      matches: tournament.matches.map((match) => ({
        id: match.id,
        stageType: match.stageType,
        groupId: match.groupId,
        groupName: match.group?.name,
        roundNumber: match.roundNumber,
        matchNumber: match.matchNumber,
        status: match.status,
        scheduledAt: match.scheduledAt,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        bestOf: match.bestOf,
        killsA: match.games[0]?.killsA ?? null,
        killsB: match.games[0]?.killsB ?? null,
        participantA: match.participantA
          ? {
              id: match.participantA.id,
              seed: match.participantA.seed,
              team: {
                name: match.participantA.team.name,
                tag: match.participantA.team.tag,
                logoUrl: match.participantA.team.logoUrl,
                iconKey: participantIconKeys.get(match.participantA.id),
              },
            }
          : null,
        participantB: match.participantB
          ? {
              id: match.participantB.id,
              seed: match.participantB.seed,
              team: {
                name: match.participantB.team.name,
                tag: match.participantB.team.tag,
                logoUrl: match.participantB.team.logoUrl,
                iconKey: participantIconKeys.get(match.participantB.id),
              },
            }
          : null,
        winnerParticipantId: match.winnerParticipantId,
      })).filter(
        (match) => match.stageType !== "group" || Boolean(match.groupId),
      ),
      bracket: mainPlayoffMatches.map(mapPlayoffMatch),
      thirdPlaceMatch:
        tournament.thirdPlaceEnabled && thirdPlaceMatch
          ? mapPlayoffMatch(thirdPlaceMatch)
          : null,
      playoffPreview,
    };
  } catch (error) {
    console.error("Falling back to demo tournament overview", error);
    return getDemoOverview();
  }
}
