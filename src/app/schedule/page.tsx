import { Shield, Trophy } from "lucide-react";
import Link from "next/link";

import { LiveTournamentRefresh } from "@/components/live-tournament-refresh";
import { PublicMatchSchedule } from "@/components/public-match-schedule";
import { buttonVariants } from "@/components/ui/button";
import { getTournamentOverview } from "@/lib/tournament/data";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const overview = await getTournamentOverview();

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <LiveTournamentRefresh />
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">
              Match Center
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-normal sm:text-5xl">
              Match Schedule
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {overview.tournament.name}
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link className={buttonVariants({ variant: "secondary" })} href="/">
              <Trophy />
              Public Page
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/admin">
              <Shield />
              Admin
            </Link>
          </nav>
        </header>

        <PublicMatchSchedule matches={overview.matches} />
      </div>
    </main>
  );
}
