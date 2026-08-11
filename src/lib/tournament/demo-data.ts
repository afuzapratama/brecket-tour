import { buildSingleEliminationBracket } from "@/lib/tournament/bracket";
import { calculateStandings } from "@/lib/tournament/standings";
import type {
  BracketSeed,
  MatchResult,
  Participant,
} from "@/lib/tournament/types";

export const demoTournament = {
  id: "demo-tournament",
  name: "Esport Merdeka Invitational",
  slug: "esport-merdeka-invitational",
  game: "Valorant",
  status: "live",
  region: "Indonesia",
  startDate: "2026-08-17T12:00:00+07:00",
};

export const demoParticipants: Participant[] = [
  {
    id: "garuda-prime",
    seed: 1,
    team: { name: "Garuda Prime", tag: "GDP" },
  },
  {
    id: "merah-putih-x",
    seed: 2,
    team: { name: "Merah Putih X", tag: "MPX" },
  },
  {
    id: "borneo-strike",
    seed: 3,
    team: { name: "Borneo Strike", tag: "BRS" },
  },
  {
    id: "java-syndicate",
    seed: 4,
    team: { name: "Java Syndicate", tag: "JVS" },
  },
  {
    id: "sumatra-core",
    seed: 5,
    team: { name: "Sumatra Core", tag: "SMC" },
  },
  {
    id: "bali-venom",
    seed: 6,
    team: { name: "Bali Venom", tag: "BLV" },
  },
  {
    id: "papua-titans",
    seed: 7,
    team: { name: "Papua Titans", tag: "PPT" },
  },
  {
    id: "sulawesi-echo",
    seed: 8,
    team: { name: "Sulawesi Echo", tag: "SWE" },
  },
];

export const demoGroups = [
  {
    id: "group-a",
    name: "Group A",
    topQualifyCount: 2,
    participantIds: [
      "garuda-prime",
      "java-syndicate",
      "sumatra-core",
      "papua-titans",
    ],
  },
  {
    id: "group-b",
    name: "Group B",
    topQualifyCount: 2,
    participantIds: [
      "merah-putih-x",
      "borneo-strike",
      "bali-venom",
      "sulawesi-echo",
    ],
  },
];

export const demoMatches: MatchResult[] = [
  {
    id: "a-1",
    participantAId: "garuda-prime",
    participantBId: "java-syndicate",
    scoreA: 2,
    scoreB: 0,
    winnerParticipantId: "garuda-prime",
    status: "completed",
    games: [
      { scoreA: 13, scoreB: 8, killsA: 78, deathsA: 57, killsB: 57, deathsB: 78 },
      { scoreA: 13, scoreB: 10, killsA: 82, deathsA: 68, killsB: 68, deathsB: 82 },
    ],
  },
  {
    id: "a-2",
    participantAId: "sumatra-core",
    participantBId: "papua-titans",
    scoreA: 2,
    scoreB: 1,
    winnerParticipantId: "sumatra-core",
    status: "completed",
    games: [
      { scoreA: 13, scoreB: 6, killsA: 70, deathsA: 45, killsB: 45, deathsB: 70 },
      { scoreA: 9, scoreB: 13, killsA: 54, deathsA: 63, killsB: 63, deathsB: 54 },
      { scoreA: 13, scoreB: 11, killsA: 84, deathsA: 79, killsB: 79, deathsB: 84 },
    ],
  },
  {
    id: "a-3",
    participantAId: "garuda-prime",
    participantBId: "sumatra-core",
    scoreA: 2,
    scoreB: 1,
    winnerParticipantId: "garuda-prime",
    status: "completed",
    games: [
      { scoreA: 13, scoreB: 7, killsA: 74, deathsA: 48, killsB: 48, deathsB: 74 },
      { scoreA: 11, scoreB: 13, killsA: 69, deathsA: 73, killsB: 73, deathsB: 69 },
      { scoreA: 13, scoreB: 9, killsA: 86, deathsA: 61, killsB: 61, deathsB: 86 },
    ],
  },
  {
    id: "a-4",
    participantAId: "java-syndicate",
    participantBId: "papua-titans",
    scoreA: 1,
    scoreB: 2,
    winnerParticipantId: "papua-titans",
    status: "completed",
    games: [
      { scoreA: 13, scoreB: 10, killsA: 65, deathsA: 59, killsB: 59, deathsB: 65 },
      { scoreA: 8, scoreB: 13, killsA: 52, deathsA: 71, killsB: 71, deathsB: 52 },
      { scoreA: 10, scoreB: 13, killsA: 60, deathsA: 72, killsB: 72, deathsB: 60 },
    ],
  },
  {
    id: "b-1",
    participantAId: "merah-putih-x",
    participantBId: "bali-venom",
    scoreA: 2,
    scoreB: 0,
    winnerParticipantId: "merah-putih-x",
    status: "completed",
    games: [
      { scoreA: 13, scoreB: 5, killsA: 80, deathsA: 49, killsB: 49, deathsB: 80 },
      { scoreA: 13, scoreB: 9, killsA: 75, deathsA: 61, killsB: 61, deathsB: 75 },
    ],
  },
  {
    id: "b-2",
    participantAId: "borneo-strike",
    participantBId: "sulawesi-echo",
    scoreA: 2,
    scoreB: 1,
    winnerParticipantId: "borneo-strike",
    status: "completed",
    games: [
      { scoreA: 13, scoreB: 11, killsA: 88, deathsA: 75, killsB: 75, deathsB: 88 },
      { scoreA: 10, scoreB: 13, killsA: 58, deathsA: 69, killsB: 69, deathsB: 58 },
      { scoreA: 13, scoreB: 6, killsA: 77, deathsA: 50, killsB: 50, deathsB: 77 },
    ],
  },
  {
    id: "b-3",
    participantAId: "merah-putih-x",
    participantBId: "borneo-strike",
    scoreA: 1,
    scoreB: 2,
    winnerParticipantId: "borneo-strike",
    status: "completed",
    games: [
      { scoreA: 13, scoreB: 8, killsA: 73, deathsA: 58, killsB: 58, deathsB: 73 },
      { scoreA: 7, scoreB: 13, killsA: 45, deathsA: 74, killsB: 74, deathsB: 45 },
      { scoreA: 11, scoreB: 13, killsA: 69, deathsA: 82, killsB: 82, deathsB: 69 },
    ],
  },
  {
    id: "b-4",
    participantAId: "bali-venom",
    participantBId: "sulawesi-echo",
    scoreA: 0,
    scoreB: 2,
    winnerParticipantId: "sulawesi-echo",
    status: "completed",
    games: [
      { scoreA: 8, scoreB: 13, killsA: 55, deathsA: 70, killsB: 70, deathsB: 55 },
      { scoreA: 10, scoreB: 13, killsA: 60, deathsA: 76, killsB: 76, deathsB: 60 },
    ],
  },
  {
    id: "a-5",
    participantAId: "garuda-prime",
    participantBId: "papua-titans",
    scoreA: null,
    scoreB: null,
    status: "live",
  },
  {
    id: "b-5",
    participantAId: "merah-putih-x",
    participantBId: "sulawesi-echo",
    scoreA: null,
    scoreB: null,
    status: "scheduled",
  },
];

export function getParticipant(participantId?: string | null) {
  return demoParticipants.find((participant) => participant.id === participantId);
}

export function getDemoGroupsWithStandings() {
  return demoGroups.map((group) => {
    const participants = demoParticipants.filter((participant) =>
      group.participantIds.includes(participant.id),
    );
    const matches = demoMatches.filter(
      (match) =>
        match.participantAId &&
        match.participantBId &&
        group.participantIds.includes(match.participantAId) &&
        group.participantIds.includes(match.participantBId),
    );

    return {
      ...group,
      participants,
      matches,
      standings: calculateStandings(participants, matches),
    };
  });
}

export function getDemoBracket() {
  const seeds: BracketSeed[] = getDemoGroupsWithStandings().flatMap((group) =>
    group.standings
      .filter((standing) => standing.rank <= group.topQualifyCount)
      .map((standing) => ({
        participantId: standing.participantId,
        sourceGroupId: group.id,
        sourceGroupName: group.name,
        sourceRank: standing.rank,
      })),
  );

  return buildSingleEliminationBracket(seeds);
}
