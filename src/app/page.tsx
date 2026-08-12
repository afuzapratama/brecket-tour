import {
  CalendarClock,
  Crown,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { LiveTournamentRefresh } from "@/components/live-tournament-refresh";
import { PublicBracketView } from "@/components/public-bracket-view";
import { TeamLogo } from "@/components/team-logo";
import { getTournamentOverview } from "@/lib/tournament/data";

export const dynamic = "force-dynamic";

function formatParticipant(participant?: { team: { name: string } } | null) {
  return participant?.team.name ?? "TBD";
}

export default async function Home() {
  const overview = await getTournamentOverview();
  const previewFinalRound = Math.max(
    0,
    ...overview.playoffPreview.map((match) => match.roundNumber),
  );
  const publicBracket =
    overview.bracket.length > 0
      ? overview.bracket
      : overview.playoffPreview.map((match) => ({
          ...match,
          status: "TBD",
          scoreA: null,
          scoreB: null,
          bestOf:
            match.roundNumber === previewFinalRound && match.matchNumber === 1
              ? 5
              : 3,
          participantA: null,
          participantB: null,
          winnerParticipantId: null,
        }));
  const canShowThirdPlace =
    overview.tournament.thirdPlaceEnabled &&
    (publicBracket.at(-1)?.roundNumber ?? 0) > 1;
  const thirdPlacePublicMatch =
    canShowThirdPlace && overview.thirdPlaceMatch
      ? overview.thirdPlaceMatch
      : canShowThirdPlace
        ? {
            id: "third-place-preview",
            roundNumber: publicBracket.at(-1)?.roundNumber ?? 1,
            matchNumber: 2,
            status: "TBD",
            scoreA: null,
            scoreB: null,
            bestOf: 3,
            participantA: null,
            participantB: null,
            winnerParticipantId: null,
          }
        : null;
  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <LiveTournamentRefresh />
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-normal sm:text-5xl">
              {overview.tournament.name}
            </h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/schedule"
            >
              <CalendarClock />
              Match Schedule
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-lg shadow-primary/10 transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4"
              href="/admin"
            >
              <Shield />
              Admin
            </Link>
          </nav>
        </header>

        <section className="rounded-lg border border-white/10 bg-card/80 p-5 shadow-xl shadow-black/10">
            <div className="flex items-center gap-2 text-primary">
              <Swords className="size-5" />
              <h2 className="font-bold">Sistem Pertandingan</h2>
            </div>
            <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-background/60 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Group Stage
                </p>
                <p className="mt-1 font-semibold">
                  Top {overview.groups[0]?.topQualifyCount ?? 2} setiap group
                  lolos ke playoff.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-background/60 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Playoff
                </p>
                <p className="mt-1 font-semibold">
                  Single elimination, winner lanjut otomatis ke round berikutnya.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-background/60 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Standings
                </p>
                <p className="mt-1 font-semibold">
                  Ranking group memakai P, W, L, KD, dan TM manual.
                </p>
              </div>
              {overview.tournament.rules ? (
                <div
                  className="rounded-lg border border-white/10 bg-background/60 p-3"
                >
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Rules
                  </p>
                  <p className="mt-1 leading-6 text-muted-foreground">
                    {overview.tournament.rules}
                  </p>
                </div>
              ) : null}
            </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {overview.groups.map((group) => (
            <div
              className="rounded-lg border border-white/10 bg-card/80 p-5 shadow-xl shadow-black/10"
              key={group.id}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy className="size-5 text-primary" />
                  <h2 className="font-bold">{group.name} Standings</h2>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  Top {group.topQualifyCount}
                </span>
              </div>
              <div className="overflow-hidden">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-7 sm:w-8" />
                    <col />
                    <col className="w-7 sm:w-9" />
                    <col className="w-7 sm:w-9" />
                    <col className="w-7 sm:w-9" />
                    <col className="w-8 sm:w-11" />
                    <col className="w-8 sm:w-10" />
                  </colgroup>
                  <thead className="text-[10px] uppercase text-muted-foreground sm:text-xs">
                    <tr className="border-b border-white/10">
                      <th className="py-3">#</th>
                      <th>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>L</th>
                      <th>KD</th>
                      <th>TM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.map((standing) => (
                      <tr
                        className={
                          standing.rank <= group.topQualifyCount
                            ? "border-b border-primary/15 bg-primary/[0.04]"
                            : "border-b border-white/10"
                        }
                        key={standing.participantId}
                      >
                        <td className="py-3 pr-1 font-bold text-primary">
                          {standing.rank}
                        </td>
                        <td className="min-w-0 pr-1 font-semibold sm:pr-2">
                          <TeamLogo
                            className="mr-1 inline-flex size-5 align-middle sm:mr-2 sm:size-6"
                            iconKey={standing.participant?.team.iconKey}
                            logoUrl={standing.participant?.team.logoUrl}
                            name={formatParticipant(standing.participant)}
                          />
                          <span className="inline-block max-w-[94px] truncate align-middle sm:max-w-none">
                            {formatParticipant(standing.participant)}
                          </span>
                        </td>
                        <td>{standing.played}</td>
                        <td>{standing.wins}</td>
                        <td>{standing.losses}</td>
                        <td className="font-bold">{standing.killDiff}</td>
                        <td>{standing.tm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-white/10 bg-card/80 p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Crown className="size-5 text-primary" />
              <h2 className="font-bold">Single Elimination Bracket</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="size-4" />
              {publicBracket.length + (thirdPlacePublicMatch ? 1 : 0)} match
            </div>
          </div>
          <PublicBracketView
            matches={publicBracket}
            thirdPlaceMatch={thirdPlacePublicMatch}
          />
        </section>
      </div>
    </main>
  );
}
