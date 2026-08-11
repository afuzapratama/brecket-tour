import type {
  BracketSeed,
  GeneratedBracketMatch,
} from "@/lib/tournament/types";

function nextPowerOfTwo(value: number) {
  let power = 1;

  while (power < value) {
    power *= 2;
  }

  return power;
}

function pairSeeds(seeds: BracketSeed[]) {
  const bracketSize = nextPowerOfTwo(seeds.length);
  const slots = [...seeds];

  while (slots.length < bracketSize) {
    slots.push({
      participantId: "bye",
      sourceGroupId: "bye",
      sourceGroupName: "BYE",
      sourceRank: 0,
    });
  }

  const matches: GeneratedBracketMatch[] = [];
  let matchNumber = 1;

  for (let index = 0; index < slots.length / 2; index += 1) {
    matches.push({
      roundNumber: 1,
      matchNumber,
      slotA: slots[index],
      slotB: slots[slots.length - 1 - index],
    });
    matchNumber += 1;
  }

  return { bracketSize, matches };
}

export function buildSingleEliminationBracket(seeds: BracketSeed[]) {
  const activeSeeds = seeds.filter((seed) => seed.participantId !== "bye");
  const { bracketSize, matches } = pairSeeds(activeSeeds);
  const totalRounds = Math.log2(bracketSize);
  const generated: GeneratedBracketMatch[] = [...matches];

  for (let round = 2; round <= totalRounds; round += 1) {
    const matchCount = bracketSize / 2 ** round;

    for (let matchNumber = 1; matchNumber <= matchCount; matchNumber += 1) {
      generated.push({
        roundNumber: round,
        matchNumber,
      });
    }
  }

  return generated;
}

export function buildDefaultQualifierSeeds(
  groups: Array<{
    id: string;
    name: string;
    standings: Array<{ participantId: string; rank: number }>;
    topQualifyCount: number;
  }>,
) {
  const qualifiers = groups.flatMap((group) =>
    group.standings
      .filter((standing) => standing.rank <= group.topQualifyCount)
      .map((standing) => ({
        participantId: standing.participantId,
        sourceGroupId: group.id,
        sourceGroupName: group.name,
        sourceRank: standing.rank,
      })),
  );

  return qualifiers.sort((a, b) => {
    if (a.sourceRank !== b.sourceRank) {
      return a.sourceRank - b.sourceRank;
    }

    return a.sourceGroupName.localeCompare(b.sourceGroupName);
  });
}
