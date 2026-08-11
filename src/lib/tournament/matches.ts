import type { GeneratedMatch, Participant } from "@/lib/tournament/types";

export function generateRoundRobinMatches(
  participants: Participant[],
): GeneratedMatch[] {
  const ordered = [...participants].sort((a, b) => {
    const seedA = a.seed ?? Number.MAX_SAFE_INTEGER;
    const seedB = b.seed ?? Number.MAX_SAFE_INTEGER;

    return seedA - seedB || a.team.name.localeCompare(b.team.name);
  });

  const matches: GeneratedMatch[] = [];
  let matchNumber = 1;

  for (let a = 0; a < ordered.length; a += 1) {
    for (let b = a + 1; b < ordered.length; b += 1) {
      matches.push({
        roundNumber: b,
        matchNumber,
        participantAId: ordered[a].id,
        participantBId: ordered[b].id,
      });
      matchNumber += 1;
    }
  }

  return matches;
}
