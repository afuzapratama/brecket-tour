import {
  Brackets,
  CalendarClock,
  Home,
  Settings,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";

import {
  addTournamentParticipant,
  assignParticipantToGroup,
  clearPlayoffs,
  createGroup,
  deleteGroup,
  generateGroupMatches,
  generatePlayoffs,
  removeParticipantFromGroup,
  removeTournamentParticipant,
  signOut,
  updateGroupParticipantTm,
  updateMatchResult,
  updatePlayoffResult,
  updateTournament,
} from "@/app/admin/actions";
import { AdminFlash, type AdminFlashMessage } from "@/components/admin-flash";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { TeamLogo } from "@/components/team-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { getTournamentOverview } from "@/lib/tournament/data";
import { cn } from "@/lib/utils";

type Overview = Awaited<ReturnType<typeof getTournamentOverview>>;
type PlayoffMatch = Overview["bracket"][number] | NonNullable<Overview["thirdPlaceMatch"]>;

const matchStatuses = [
  "scheduled",
  "live",
  "completed",
  "disputed",
  "cancelled",
] as const;

const adminNav = [
  { label: "Home", href: "/admin", icon: Home },
  { label: "Match", href: "/admin/matches", icon: CalendarClock },
  { label: "Playoff", href: "/admin/playoff", icon: Brackets },
  { label: "Groups", href: "/admin/groups", icon: Trophy },
  { label: "Teams", href: "/admin/teams", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function playoffMatchTitle(match: PlayoffMatch, finalRound: number) {
  if (match.roundNumber === finalRound && match.matchNumber === 1) {
    return "Grand Final";
  }

  if (match.roundNumber === finalRound && match.matchNumber === 2) {
    return "Third Place Match";
  }

  if (match.roundNumber === finalRound - 1) {
    return "Semifinal";
  }

  return `Playoff Round ${match.roundNumber}`;
}

function statusBadgeClass(status?: string | null) {
  switch (status) {
    case "live":
      return "bg-red-500/15 text-red-300 ring-1 ring-red-500/25";
    case "completed":
      return "bg-primary/15 text-primary ring-1 ring-primary/25";
    case "disputed":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25";
    case "cancelled":
      return "bg-zinc-500/20 text-zinc-300 ring-1 ring-zinc-500/25";
    case "scheduled":
    default:
      return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25";
  }
}

function formatDateTimeLocal(value?: Date | null) {
  if (!value) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).formatToParts(value);
  const partMap = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}`;
}

async function getAdminFlash() {
  const cookieStore = await cookies();
  const flashCookie = cookieStore.get("admin_flash");

  if (!flashCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(flashCookie.value)) as AdminFlashMessage;
  } catch {
    return null;
  }
}

export async function AdminShell({
  active,
  children,
  description,
  overview,
  title,
}: {
  active: string;
  children: React.ReactNode;
  description: string;
  overview: Overview;
  title: string;
}) {
  const flash = await getAdminFlash();

  return (
    <main className="min-h-screen overflow-x-hidden px-3 pb-24 pt-3 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="rounded-lg border border-white/10 bg-card/70 px-3 py-3 shadow-lg shadow-black/10 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="hidden text-xs font-semibold uppercase text-primary sm:inline">
                  Admin
                </span>
                <h1 className="truncate text-lg font-black sm:text-xl">
                  {title}
                </h1>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                {overview.tournament.name} · {description}
              </p>
            </div>
            <form className="shrink-0" action={signOut}>
              <Button size="sm" variant="destructive" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </header>

        <nav className="hidden gap-2 overflow-x-auto md:flex">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === active;

            return (
              <Link
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-white/10 bg-card/75 px-3 text-sm font-semibold text-muted-foreground transition",
                  isActive && "border-primary/40 bg-primary/10 text-primary",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}

        <div className="hidden gap-2 pb-6 sm:flex">
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            Public Page
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href="/schedule">
            Match Schedule
          </Link>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-2xl shadow-black/40 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === active;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "grid min-h-14 place-items-center gap-1 rounded-lg px-1 py-1 text-[10px] font-semibold text-muted-foreground transition",
                  isActive && "bg-primary/12 text-primary ring-1 ring-primary/30",
                )}
                href={item.href}
                key={`mobile-${item.href}`}
              >
                <Icon className="size-5" />
                <span className="max-w-full truncate leading-none">
                  {item.label === "Settings" ? "Set" : item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <AdminFlash flash={flash} />
    </main>
  );
}

export function AdminDashboard({ overview }: { overview: Overview }) {
  const completedMatches = overview.matches.filter(
    (match) => match.status === "completed",
  ).length;
  const liveMatches = overview.matches.filter(
    (match) => match.status === "live",
  ).length;

  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Teams", overview.participants.length],
          ["Groups", overview.groups.length],
          ["Matches", overview.matches.length],
          ["Live", liveMatches],
        ].map(([label, value]) => (
          <div
            className="rounded-lg border border-white/10 bg-card/80 p-4 shadow-lg shadow-black/10"
            key={label}
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-black text-primary">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {[
          {
            href: "/admin/matches",
            icon: CalendarClock,
            title: "Input Pertandingan",
            meta: `${overview.matches.length} match, ${completedMatches} selesai`,
          },
          {
            href: "/admin/playoff",
            icon: Brackets,
            title: "Playoff Bracket",
            meta: `${overview.bracket.length} bracket match`,
          },
          {
            href: "/admin/groups",
            icon: Trophy,
            title: "Atur Group",
            meta: `${overview.groups.length} group aktif`,
          },
          {
            href: "/admin/teams",
            icon: Users,
            title: "Daftar Team",
            meta: `${overview.participants.length} peserta`,
          },
          {
            href: "/admin/settings",
            icon: Settings,
            title: "Tournament Settings",
            meta: overview.tournament.name,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="rounded-lg border border-white/10 bg-card/80 p-4 shadow-lg shadow-black/10 transition hover:border-primary/40"
              href={item.href}
              key={item.href}
            >
              <Icon className="size-5 text-primary" />
              <h2 className="mt-3 text-lg font-bold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-lg border border-white/10 bg-card/80 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="size-4 text-primary" />
          Data source: {overview.source}
        </div>
      </section>
    </div>
  );
}

export function TeamControl({ overview }: { overview: Overview }) {
  return (
    <section className="rounded-lg border border-white/10 bg-card/80 p-4 shadow-xl shadow-black/10">
      <h2 className="text-lg font-bold">Team Participant</h2>
      <form action={addTournamentParticipant} className="mt-4 grid gap-3">
        <input name="tournamentId" type="hidden" value={overview.tournament.id} />
        <input
          className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
          name="teamName"
          placeholder="Team name"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm uppercase outline-none ring-primary/40 transition focus:ring-2"
            name="teamTag"
            placeholder="TAG"
          />
          <input
            className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
            name="country"
            placeholder="ID"
          />
        </div>
        <input
          className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
          name="logoUrl"
          placeholder="Logo URL"
          type="url"
        />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
            min="1"
            name="seed"
            placeholder="Seed"
            type="number"
          />
          <Button type="submit">Add</Button>
        </div>
      </form>

      <div className="mt-5 grid gap-2">
        {overview.participants.map((participant) => (
          <div
            className="grid gap-3 rounded-lg border border-white/10 bg-background/55 p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
            key={participant.id}
          >
            <div className="flex min-w-0 items-center gap-2">
              <TeamLogo
                iconKey={participant.team.iconKey}
                logoUrl={participant.team.logoUrl}
                name={participant.team.name}
              />
              <div className="min-w-0">
                <p className="truncate font-semibold">{participant.team.name}</p>
                <p className="text-xs text-muted-foreground">
                  Seed {participant.seed ?? "-"} · {participant.team.tag ?? "NO TAG"}
                </p>
              </div>
            </div>
            <form action={removeTournamentParticipant}>
              <input name="participantId" type="hidden" value={participant.id} />
              <ConfirmSubmitButton
                className="w-full sm:w-auto"
                message="Hapus team ini dari tournament?"
                size="sm"
                type="submit"
                variant="destructive"
              >
                Remove
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GroupControl({ overview }: { overview: Overview }) {
  const groupedParticipantIds = new Set(
    overview.groups.flatMap((group) =>
      group.participants.map((entry) => entry.participant.id),
    ),
  );

  return (
    <section className="rounded-lg border border-white/10 bg-card/80 p-4 shadow-xl shadow-black/10">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold">Group Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat group, assign team, dan input TM manual.
          </p>
        </div>
        <form action={createGroup} className="grid gap-2 sm:grid-cols-[1fr_96px_auto]">
          <input name="tournamentId" type="hidden" value={overview.tournament.id} />
          <input
            className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
            name="name"
            placeholder="Group A"
            required
          />
          <input
            className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
            defaultValue={1}
            min="1"
            name="topQualifyCount"
            type="number"
          />
          <Button type="submit">Create</Button>
        </form>
      </div>

      <div className="mt-5 grid gap-4">
        {overview.groups.map((group) => {
          const availableParticipants = overview.participants.filter(
            (participant) => !groupedParticipantIds.has(participant.id),
          );

          return (
            <article
              className="rounded-lg border border-white/10 bg-background/55 p-4 shadow-lg shadow-black/10"
              key={group.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{group.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Top {group.topQualifyCount} qualify
                  </p>
                </div>
                <form action={deleteGroup}>
                  <input name="groupId" type="hidden" value={group.id} />
                  <ConfirmSubmitButton
                    message="Hapus group ini beserta data yang terkait?"
                    size="sm"
                    type="submit"
                    variant="destructive"
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </div>

              <form action={assignParticipantToGroup} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input name="groupId" type="hidden" value={group.id} />
                <select
                  className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
                  disabled={availableParticipants.length === 0}
                  name="participantId"
                  required
                >
                  <option value="">Select team</option>
                  {availableParticipants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.seed ? `#${participant.seed} ` : ""}
                      {participant.team.name}
                    </option>
                  ))}
                </select>
                <Button disabled={availableParticipants.length === 0} type="submit">
                  Assign
                </Button>
              </form>

              <div className="mt-4 grid gap-2">
                {group.participants.length === 0 ? (
                  <p className="rounded-md border border-white/10 px-3 py-2 text-sm text-muted-foreground">
                    Belum ada team di group ini.
                  </p>
                ) : (
                  group.participants.map((entry) => (
                    <div
                      className="grid gap-3 rounded-md border border-white/10 px-3 py-2 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
                      key={entry.id}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <TeamLogo
                          iconKey={entry.participant.team.iconKey}
                          logoUrl={entry.participant.team.logoUrl}
                          name={entry.participant.team.name}
                        />
                        <div className="min-w-0">
                          <span className="font-semibold">
                            {entry.participant.team.name}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {entry.participant.team.tag ?? "NO TAG"}
                          </span>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:flex sm:items-center">
                        <form
                          action={updateGroupParticipantTm}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-2"
                        >
                          <input name="groupParticipantId" type="hidden" value={entry.id} />
                          <label className="text-xs text-muted-foreground">TM</label>
                          <input
                            className="h-9 min-w-0 rounded-md border border-white/10 bg-background/70 px-2 text-sm outline-none ring-primary/40 transition focus:ring-2 sm:w-20"
                            defaultValue={entry.tm}
                            min="0"
                            name="tm"
                            type="number"
                          />
                          <Button size="sm" type="submit" variant="outline">
                            Save
                          </Button>
                        </form>
                        <form action={removeParticipantFromGroup}>
                          <input name="groupParticipantId" type="hidden" value={entry.id} />
                          <ConfirmSubmitButton
                            className="w-full sm:w-auto"
                            message="Keluarkan team ini dari group?"
                            size="sm"
                            type="submit"
                            variant="destructive"
                          >
                            Remove
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function MatchControl({ overview }: { overview: Overview }) {
  const groupMatches = overview.matches.filter(
    (match) => match.stageType === "group",
  );

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-card/80 p-4 shadow-xl shadow-black/10 [&_input]:min-w-0 [&_input]:w-full [&_select]:min-w-0 [&_select]:w-full">
      <h2 className="text-lg font-bold">Match Results</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Input score, kill, status, dan jadwal group stage.
      </p>

      <div className="mt-5 grid gap-4">
        {overview.groups.map((group) => {
          const matches = groupMatches.filter((match) => match.groupId === group.id);
          const completedMatches = matches.filter(
            (match) => match.status === "completed",
          ).length;
          const groupIsComplete =
            matches.length > 0 && completedMatches === matches.length;

          return (
            <details
              className="overflow-hidden rounded-lg border border-white/10 bg-background/55"
              key={group.id}
              open={!groupIsComplete}
            >
              <summary className="grid cursor-pointer list-none gap-3 p-4 marker:hidden sm:grid-cols-[1fr_auto] sm:items-center [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{group.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {completedMatches}/{matches.length} completed
                  </p>
                </div>
                <span className="rounded-md border border-white/10 bg-card/70 px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                  Tap untuk buka
                </span>
              </summary>

              <div className="border-t border-white/10 p-4 pt-3">
                <form action={generateGroupMatches}>
                  <input name="groupId" type="hidden" value={group.id} />
                  <ConfirmSubmitButton
                    className="w-full"
                    message={
                      matches.length > 0
                        ? "Generate ulang match group ini? Match lama di group ini akan diganti."
                        : "Generate match untuk group ini?"
                    }
                    type="submit"
                  >
                    Generate Matches
                  </ConfirmSubmitButton>
                </form>
              </div>

              <div className="grid gap-2 px-4 pb-4">
                {matches.length === 0 ? (
                  <p className="rounded-md border border-white/10 px-3 py-2 text-sm text-muted-foreground">
                    Belum ada match. Generate dulu dari member group.
                  </p>
                ) : (
                  matches.map((match) => (
                    <details
                      className="overflow-hidden rounded-lg border border-white/10 bg-background/60"
                      key={match.id}
                    >
                      <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-3 p-3 marker:hidden [&::-webkit-details-marker]:hidden">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Match {match.matchNumber}
                          </p>
                          <p className="mt-1 truncate text-sm font-bold sm:text-base">
                            {match.participantA?.team.name ?? "TBD"} vs {match.participantB?.team.name ?? "TBD"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {match.scoreA ?? "-"} - {match.scoreB ?? "-"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-2 py-1 text-xs font-semibold uppercase",
                            statusBadgeClass(match.status),
                          )}
                        >
                          {match.status}
                        </span>
                      </summary>

                      <form
                        action={updateMatchResult}
                        className="grid gap-3 border-t border-white/10 p-3"
                      >
                        <input name="matchId" type="hidden" value={match.id} />
                        <input name="participantAId" type="hidden" value={match.participantA?.id ?? ""} />
                        <input name="participantBId" type="hidden" value={match.participantB?.id ?? ""} />

                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
                          <p className="col-span-2 text-xs font-semibold uppercase text-muted-foreground">
                            Score
                          </p>
                          <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
                            <span className="truncate" title={match.participantA?.team.name ?? "TBD"}>
                              {match.participantA?.team.name ?? "TBD"}
                            </span>
                            <input className="h-10 rounded-md border border-white/10 bg-background/70 px-2 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2" defaultValue={match.scoreA ?? 0} min="0" name="scoreA" type="number" />
                          </label>
                          <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
                            <span className="truncate" title={match.participantB?.team.name ?? "TBD"}>
                              {match.participantB?.team.name ?? "TBD"}
                            </span>
                            <input className="h-10 rounded-md border border-white/10 bg-background/70 px-2 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2" defaultValue={match.scoreB ?? 0} min="0" name="scoreB" type="number" />
                          </label>
                        </div>

                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
                          <p className="col-span-2 text-xs font-semibold uppercase text-muted-foreground">
                            Kill Difference
                          </p>
                          <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
                            <span
                              className="truncate"
                              title={match.participantA?.team.name ?? "TBD"}
                            >
                              {match.participantA?.team.name ?? "TBD"}
                            </span>
                            <input className="h-10 rounded-md border border-white/10 bg-background/70 px-2 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2" defaultValue={match.killsA ?? ""} min="0" name="killsA" placeholder="0" type="number" />
                          </label>
                          <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
                            <span
                              className="truncate"
                              title={match.participantB?.team.name ?? "TBD"}
                            >
                              {match.participantB?.team.name ?? "TBD"}
                            </span>
                            <input className="h-10 rounded-md border border-white/10 bg-background/70 px-2 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2" defaultValue={match.killsB ?? ""} min="0" name="killsB" placeholder="0" type="number" />
                          </label>
                        </div>

                        <div className="grid gap-2">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Status & Jadwal
                          </p>
                          <select className="h-10 rounded-md border border-white/10 bg-background/70 px-2 text-sm outline-none ring-primary/40 transition focus:ring-2" defaultValue={match.status} name="status">
                            {matchStatuses.map((status) => (
                              <option
                                className="bg-background text-foreground"
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            ))}
                          </select>
                          <input className="h-10 rounded-md border border-white/10 bg-background/70 px-2 text-sm outline-none ring-primary/40 transition focus:ring-2" defaultValue={formatDateTimeLocal(match.scheduledAt)} name="scheduledAt" type="datetime-local" />
                        </div>

                        <Button className="w-full" type="submit">
                          Save Match
                        </Button>
                      </form>
                    </details>
                  ))
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function PlayoffControl({ overview }: { overview: Overview }) {
  const allGroupsReadyForPlayoff =
    overview.groups.length > 0 &&
    overview.groups.every((group) => group.isReadyForPlayoff);
  const finalRound = Math.max(
    0,
    ...overview.bracket.map((match) => match.roundNumber),
    overview.thirdPlaceMatch?.roundNumber ?? 0,
  );

  return (
    <section className="rounded-lg border border-white/10 bg-card/80 p-4 shadow-xl shadow-black/10">
      <div className="grid gap-3">
        <div>
          <h2 className="text-lg font-bold">Playoff Bracket</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate playoff dan update hasil bracket.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <form action={generatePlayoffs}>
            <input name="tournamentId" type="hidden" value={overview.tournament.id} />
            <ConfirmSubmitButton
              className="w-full"
              disabled={!allGroupsReadyForPlayoff}
              message={
                overview.bracket.length > 0
                  ? "Generate ulang playoff? Bracket playoff lama akan diganti."
                  : "Generate playoff bracket dari standings group?"
              }
              type="submit"
            >
              Generate
            </ConfirmSubmitButton>
          </form>
          <form action={clearPlayoffs}>
            <input name="tournamentId" type="hidden" value={overview.tournament.id} />
            <ConfirmSubmitButton
              className="w-full"
              message="Hapus semua playoff bracket? Data playoff akan dibuat ulang dari awal."
              type="submit"
              variant="destructive"
            >
              Clear
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {!allGroupsReadyForPlayoff ? (
        <div className="mt-4 rounded-lg border border-accent/25 bg-accent/10 p-3 text-sm text-accent">
          Selesaikan semua group match dulu sebelum generate playoff.
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {overview.groups.map((group) => (
          <div
            className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-background/55 px-3 py-2 text-sm"
            key={`playoff-ready-${group.id}`}
          >
            <span className="font-semibold">{group.name}</span>
            <span className={group.isReadyForPlayoff ? "text-primary" : "text-muted-foreground"}>
              {group.completedMatchCount}/{group.matchCount} completed
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {overview.bracket.length === 0 ? (
          <p className="rounded-md border border-white/10 bg-background/55 px-3 py-2 text-sm text-muted-foreground">
            Belum ada playoff bracket.
          </p>
        ) : (
          overview.bracket.map((match) => (
            <PlayoffMatchForm
              key={match.id}
              match={match}
              title={playoffMatchTitle(match, finalRound)}
            />
          ))
        )}
      </div>

      {overview.tournament.thirdPlaceEnabled ? (
        <div className="mt-5 border-t border-white/10 pt-5">
          <h3 className="font-bold">Third Place Match</h3>
          {overview.thirdPlaceMatch ? (
            <PlayoffMatchForm
              match={overview.thirdPlaceMatch}
              title="Third Place Match"
            />
          ) : (
            <p className="mt-3 rounded-md border border-white/10 bg-background/55 px-3 py-2 text-sm text-muted-foreground">
              Third Place Match belum dibuat. Generate playoff setelah toggle aktif.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function PlayoffMatchForm({
  match,
  title,
}: {
  match: PlayoffMatch;
  title?: string;
}) {
  return (
    <details
      className={cn(
        "overflow-hidden rounded-lg border bg-background/55 shadow-lg shadow-black/10",
        "border-white/10",
      )}
    >
      <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-3 p-3 marker:hidden [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="truncate font-bold">
            {title ?? `Round ${match.roundNumber} Match ${match.matchNumber}`}
          </h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {match.participantA?.team.name ?? "TBD"} vs{" "}
            {match.participantB?.team.name ?? "TBD"}
          </p>
        </div>
        <div className="grid justify-items-end gap-1">
          <span
            className={cn(
              "rounded-md px-2 py-1 text-xs font-semibold uppercase",
              statusBadgeClass(match.status),
            )}
          >
            {match.status ?? "scheduled"}
          </span>
          <span className="text-sm font-black text-foreground">
            {match.scoreA ?? "-"} - {match.scoreB ?? "-"}
          </span>
        </div>
      </summary>

      <form
        action={updatePlayoffResult}
        className="grid gap-3 border-t border-white/10 p-3"
      >
        <input name="matchId" type="hidden" value={match.id} />
        <input name="participantAId" type="hidden" value={match.participantA?.id ?? ""} />
        <input name="participantBId" type="hidden" value={match.participantB?.id ?? ""} />

        <div className="grid grid-cols-2 gap-2">
          <p className="col-span-2 text-xs font-semibold uppercase text-muted-foreground">
            Score Match
          </p>
          <label className="grid gap-2 text-xs text-muted-foreground">
            <span className="truncate">{match.participantA?.team.name ?? "TBD"}</span>
            <input className="h-10 rounded-md border border-white/10 bg-background/70 px-2 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2" defaultValue={match.scoreA ?? 0} min="0" name="scoreA" type="number" />
          </label>
          <label className="grid gap-2 text-xs text-muted-foreground">
            <span className="truncate">{match.participantB?.team.name ?? "TBD"}</span>
            <input className="h-10 rounded-md border border-white/10 bg-background/70 px-2 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2" defaultValue={match.scoreB ?? 0} min="0" name="scoreB" type="number" />
          </label>
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Status & Jadwal
          </p>
          <select
            className="h-10 rounded-md border border-white/10 bg-background/70 px-2 text-sm outline-none ring-primary/40 transition focus:ring-2"
            defaultValue={match.status ?? "scheduled"}
            name="status"
          >
            {matchStatuses.map((status) => (
              <option
                className="bg-background text-foreground"
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
          <input className="h-10 rounded-md border border-white/10 bg-background/70 px-2 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2" defaultValue={formatDateTimeLocal(match.scheduledAt)} name="scheduledAt" type="datetime-local" />
        </div>

        <Button
          className="w-full"
          disabled={!match.participantA || !match.participantB}
          type="submit"
        >
          Save Match
        </Button>
      </form>
    </details>
  );
}

export function SettingsControl({ overview }: { overview: Overview }) {
  return (
    <form
      action={updateTournament}
      className="rounded-lg border border-white/10 bg-card/80 p-4 shadow-xl shadow-black/10"
    >
      <input name="tournamentId" type="hidden" value={overview.tournament.id} />
      <h2 className="text-lg font-bold">Tournament Settings</h2>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-2 text-sm font-semibold">
          Name
          <input className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm font-normal outline-none ring-primary/40 transition focus:ring-2" defaultValue={overview.tournament.name} name="name" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Game
          <input className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm font-normal outline-none ring-primary/40 transition focus:ring-2" defaultValue={overview.tournament.game} name="game" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Region
          <input className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm font-normal outline-none ring-primary/40 transition focus:ring-2" defaultValue={overview.tournament.region ?? ""} name="region" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Status
          <select className="h-11 rounded-md border border-white/10 bg-background/70 px-3 text-sm font-normal outline-none ring-primary/40 transition focus:ring-2" defaultValue={overview.tournament.status} name="status">
            {["draft", "published", "live", "completed", "archived"].map(
              (status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Rules
          <textarea className="min-h-32 rounded-md border border-white/10 bg-background/70 px-3 py-2 text-sm font-normal outline-none ring-primary/40 transition focus:ring-2" defaultValue={overview.tournament.rules ?? ""} name="rules" />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-background/60 px-3 py-3 text-sm">
          <span>
            <span className="block font-semibold">Third Place Match</span>
            <span className="text-muted-foreground">
              Buat match tambahan untuk loser semifinal.
            </span>
          </span>
          <input className="size-5 accent-primary" defaultChecked={overview.tournament.thirdPlaceEnabled} name="thirdPlaceEnabled" type="checkbox" />
        </label>
        <Button className="w-full" type="submit">
          Save Tournament
        </Button>
      </div>
    </form>
  );
}
