export type ScoringConfig = {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  useKillPoints: boolean;
  killPointValue: number;
  useMapBonus: boolean;
  mapWinPointValue: number;
};

export type TiebreakerKey =
  | "points"
  | "wins"
  | "head_to_head"
  | "map_diff"
  | "kill_diff"
  | "total_kills"
  | "manual_seed";

export type Participant = {
  id: string;
  seed?: number | null;
  team: {
    name: string;
    tag?: string | null;
    logoUrl?: string | null;
  };
};

export type MatchGameResult = {
  scoreA?: number | null;
  scoreB?: number | null;
  killsA?: number | null;
  killsB?: number | null;
  deathsA?: number | null;
  deathsB?: number | null;
  winnerParticipantId?: string | null;
};

export type MatchResult = {
  id: string;
  participantAId?: string | null;
  participantBId?: string | null;
  scoreA?: number | null;
  scoreB?: number | null;
  winnerParticipantId?: string | null;
  status: "scheduled" | "live" | "completed" | "disputed" | "cancelled";
  games?: MatchGameResult[];
};

export type StandingRow = {
  participantId: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  mapWins: number;
  mapLosses: number;
  mapDiff: number;
  kills: number;
  deaths: number;
  killDiff: number;
  kdRatio: number;
  tiebreakerNotes?: string;
};

export type GeneratedMatch = {
  roundNumber: number;
  matchNumber: number;
  participantAId: string;
  participantBId: string;
};

export type BracketSeed = {
  participantId: string;
  sourceGroupName: string;
  sourceGroupId: string;
  sourceRank: number;
};

export type GeneratedBracketMatch = {
  roundNumber: number;
  matchNumber: number;
  slotA?: BracketSeed;
  slotB?: BracketSeed;
};

export const defaultScoringConfig: ScoringConfig = {
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  useKillPoints: false,
  killPointValue: 0,
  useMapBonus: false,
  mapWinPointValue: 0,
};

export const defaultTiebreakers: TiebreakerKey[] = [
  "points",
  "wins",
  "head_to_head",
  "kill_diff",
  "total_kills",
  "manual_seed",
];
