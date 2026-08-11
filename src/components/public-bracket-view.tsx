import { Crown, Trophy } from "lucide-react";

import { TeamLogo } from "@/components/team-logo";

type BracketMatch = {
  id: string;
  roundNumber: number;
  matchNumber: number;
  status?: string;
  scoreA?: number | null;
  scoreB?: number | null;
  winnerParticipantId?: string | null;
  participantA?: {
    id: string;
    team: {
      name: string;
      tag?: string | null;
      logoUrl?: string | null;
      iconKey?: number | null;
    };
  } | null;
  participantB?: {
    id: string;
    team: {
      name: string;
      tag?: string | null;
      logoUrl?: string | null;
      iconKey?: number | null;
    };
  } | null;
};

function teamName(
  participant?: { team: { name: string; tag?: string | null } } | null,
) {
  return participant?.team.name ?? "TBD";
}

function roundName(round: number, totalRounds: number) {
  if (round === totalRounds) {
    return "Grand Final";
  }

  if (round === totalRounds - 1) {
    return "Semifinals";
  }

  if (round === totalRounds - 2) {
    return "Quarterfinals";
  }

  return `Round ${round}`;
}

function TeamRow({
  participant,
  score,
  isWinner,
}: {
  participant?: BracketMatch["participantA"];
  score?: number | null;
  isWinner: boolean;
}) {
  const winnerClass = "border-primary/20 bg-primary/15";

  return (
    <div
      className={
        isWinner
          ? `grid grid-cols-[1fr_44px] border-b ${winnerClass} last:border-b-0`
          : "grid grid-cols-[1fr_44px] border-b border-white/10 bg-background/70 last:border-b-0"
      }
    >
      <div className="flex min-w-0 items-center gap-2 px-3 py-2">
        <TeamLogo
          className="bg-primary/10 text-primary"
          iconKey={participant?.team.iconKey}
          logoUrl={participant?.team.logoUrl}
          name={teamName(participant)}
        />
        <span className="truncate text-sm font-semibold">
          {teamName(participant)}
        </span>
      </div>
      <div className="flex items-center justify-center border-l border-white/10 text-sm font-black">
        {score ?? "-"}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  label,
  className = "",
}: {
  match: BracketMatch;
  label?: string;
  className?: string;
}) {
  const winnerId = match.winnerParticipantId;

  return (
    <article className={className}>
      {label ? (
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div
        className="overflow-hidden rounded-md border border-white/15 bg-card/80 shadow-lg shadow-black/20"
      >
        <TeamRow
          isWinner={winnerId === match.participantA?.id}
          participant={match.participantA}
          score={match.scoreA}
        />
        <TeamRow
          isWinner={winnerId === match.participantB?.id}
          participant={match.participantB}
          score={match.scoreB}
        />
      </div>
      <p className="mt-2 px-1 text-xs uppercase text-muted-foreground">
        {match.status ?? "scheduled"}
      </p>
    </article>
  );
}

export function PublicBracketView({
  matches,
  thirdPlaceMatch,
}: {
  matches: BracketMatch[];
  thirdPlaceMatch?: BracketMatch | null;
}) {
  const rounds = [...new Set(matches.map((match) => match.roundNumber))].sort(
    (a, b) => a - b,
  );
  const totalRounds = rounds.at(-1) ?? 1;
  const finalRound = totalRounds;
  const slotHeight = 118;
  const connectorWidth = 24;

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="grid min-w-max gap-12 px-1"
        style={{
          gridTemplateColumns: `repeat(${rounds.length}, minmax(220px, 260px))`,
        }}
      >
        {rounds.map((round) => {
          const roundMatches = matches
            .filter((match) => match.roundNumber === round)
            .sort((a, b) => a.matchNumber - b.matchNumber);

          return (
            <div className="grid content-start gap-4" key={round}>
              <div className="flex items-center gap-2 px-1">
                <Crown className="size-4 text-primary" />
                <h3 className="text-sm font-black">
                  {round === finalRound && thirdPlaceMatch
                    ? "Finals"
                    : roundName(round, totalRounds)}
                </h3>
              </div>
              <div
                className="relative rounded-lg border border-white/10 bg-background/35 p-3"
              >
                {roundMatches.map((match) => (
                  <div
                    className="relative flex items-center"
                    key={match.id}
                    style={{
                      height: `${slotHeight * 2 ** (round - 1)}px`,
                    }}
                  >
                    {round > 1 ? (
                      <span
                        className="absolute left-[-36px] top-1/2 hidden h-px bg-white/35 md:block"
                        style={{ width: `${connectorWidth}px` }}
                      />
                    ) : null}
                    {round < finalRound ? (
                      <>
                        <span
                          className="absolute right-[-36px] top-1/2 hidden h-px bg-white/35 md:block"
                          style={{ width: `${connectorWidth}px` }}
                        />
                        <span
                          className={
                            match.matchNumber % 2 === 1
                              ? "absolute right-[-36px] top-1/2 hidden w-px bg-white/35 md:block"
                              : "absolute bottom-1/2 right-[-36px] hidden w-px bg-white/35 md:block"
                          }
                          style={{
                            height: `${(slotHeight * 2 ** (round - 1)) / 2}px`,
                          }}
                        />
                      </>
                    ) : null}
                    <MatchCard
                      className="w-full"
                      label={
                        round === finalRound && thirdPlaceMatch
                          ? "Grand Final"
                          : undefined
                      }
                      match={match}
                    />
                  </div>
                ))}
                {round === finalRound && thirdPlaceMatch ? (
                  <div className="border-t border-white/10 pt-5">
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      <Trophy className="size-4" />
                      <p className="text-xs font-semibold uppercase">
                        Third Place Match
                      </p>
                    </div>
                    <MatchCard match={thirdPlaceMatch} />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
