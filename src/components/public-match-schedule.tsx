import { CalendarClock, CheckCircle2, Clock3, Radio } from "lucide-react";

import { TeamLogo } from "@/components/team-logo";

type ScheduleMatch = {
  id: string;
  stageType: string;
  roundNumber?: number | null;
  matchNumber: number;
  groupName?: string | null;
  status: string;
  scheduledAt?: Date | null;
  scoreA?: number | null;
  scoreB?: number | null;
  bestOf?: number;
  participantA?: {
    team: {
      name: string;
      tag?: string | null;
      logoUrl?: string | null;
      iconKey?: number | null;
    };
  } | null;
  participantB?: {
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

function formatDay(value?: Date | null) {
  if (!value) {
    return "JADWAL TBD";
  }

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  })
    .format(value)
    .toUpperCase();
}

function formatTime(value?: Date | null) {
  if (!value) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function stageLabel(match: ScheduleMatch, finalRound: number) {
  if (match.stageType === "group") {
    return match.groupName ?? "Group Stage";
  }

  if (match.roundNumber === finalRound && match.matchNumber === 1) {
    return "Grand Final";
  }

  if (match.roundNumber === finalRound && match.matchNumber === 2) {
    return "Third Place Match";
  }

  if (match.roundNumber === finalRound - 1) {
    return "Semifinal";
  }

  if (match.roundNumber) {
    return `Playoff Round ${match.roundNumber}`;
  }

  return "Playoff";
}

function bestOfLabel(match: ScheduleMatch, finalRound: number) {
  if (match.bestOf) {
    return `BO${match.bestOf}`;
  }

  if (match.stageType === "group") {
    return "BO1";
  }

  if (match.roundNumber === finalRound && match.matchNumber === 1) {
    return "BO5";
  }

  return "BO3";
}

function statusMeta(match: ScheduleMatch) {
  if (match.status === "completed") {
    return {
      label: "Completed",
      className: "bg-primary/15 text-primary ring-1 ring-primary/25",
      icon: CheckCircle2,
    };
  }

  if (match.status === "live") {
    return {
      label: "Live",
      className: "bg-red-500/15 text-red-300 ring-1 ring-red-500/25",
      icon: Radio,
    };
  }

  if (!match.scheduledAt) {
    return {
      label: "TBD",
      className: "bg-white/10 text-muted-foreground ring-1 ring-white/10",
      icon: Clock3,
    };
  }

  return {
    label: "Upcoming",
    className: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
    icon: Clock3,
  };
}

function stageAccentClass(label: string) {
  if (label === "Grand Final") {
    return "border-amber-400/60 bg-amber-400/10 text-amber-200";
  }

  if (label === "Third Place Match") {
    return "border-primary/35 bg-primary/10 text-primary";
  }

  if (label === "Semifinal" || label.startsWith("Playoff")) {
    return "border-cyan-400/45 bg-cyan-400/10 text-cyan-100";
  }

  return "border-primary/35 bg-primary/10 text-primary";
}

function groupSchedule(matches: ScheduleMatch[]) {
  const grouped = new Map<string, ScheduleMatch[]>();

  for (const match of matches) {
    const key = formatDay(match.scheduledAt);
    grouped.set(key, [...(grouped.get(key) ?? []), match]);
  }

  return [...grouped.entries()];
}

function TeamLine({
  participant,
}: {
  participant?: ScheduleMatch["participantA"];
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <TeamLogo
        className="size-6 rounded-sm"
        iconKey={participant?.team.iconKey}
        logoUrl={participant?.team.logoUrl}
        name={teamName(participant)}
      />
      <span className="truncate font-semibold">{teamName(participant)}</span>
    </div>
  );
}

function MatchScheduleRows({
  groupedMatches,
  finalRound,
}: {
  groupedMatches: Array<[string, ScheduleMatch[]]>;
  finalRound: number;
}) {
  return (
    <div className="grid gap-6">
      {groupedMatches.map(([day, dayMatches]) => (
        <div key={day}>
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="h-px flex-1 bg-gradient-to-r from-primary/35 to-transparent" />
            <p className="text-xs font-black uppercase text-muted-foreground">
              {day}
            </p>
          </div>
          <div className="overflow-hidden rounded-md border border-white/10 bg-background/55 shadow-inner shadow-black/20">
            {dayMatches.map((match) => {
              const StatusIcon = statusMeta(match).icon;
              const meta = statusMeta(match);
              const stage = stageLabel(match, finalRound);
              const bestOf = bestOfLabel(match, finalRound);

              return (
                <article
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/10 px-3 py-3 transition hover:bg-primary/[0.035] last:border-b-0 sm:grid-cols-[88px_1fr_72px_122px_190px] sm:px-4 lg:grid-cols-[92px_1fr_92px_130px_220px]"
                  key={match.id}
                >
                  <div className="min-w-0 sm:contents">
                    <div className="mb-2 text-xs font-semibold text-muted-foreground sm:mb-0 sm:text-sm">
                      {formatTime(match.scheduledAt)}
                    </div>
                    <div className="grid min-w-0 gap-1 text-sm">
                      <TeamLine participant={match.participantA} />
                      <TeamLine participant={match.participantB} />
                    </div>
                  </div>

                  <div className="grid justify-items-end gap-2 sm:contents">
                    <div className="text-sm font-black">
                      {match.scoreA ?? "-"} - {match.scoreB ?? "-"}
                    </div>

                    <div
                      className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase sm:gap-2 sm:px-2.5 sm:text-xs ${meta.className}`}
                    >
                      <StatusIcon className="size-3.5" />
                      {meta.label}
                    </div>

                    <div className="border-l border-white/10 pl-3 text-right text-sm sm:pl-4">
                      <p
                        className={`ml-auto max-w-32 truncate rounded-md border px-2 py-1 text-xs font-bold uppercase sm:max-w-none ${stageAccentClass(stage)}`}
                      >
                        {stage}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        {bestOf} - Match {match.matchNumber}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicMatchSchedule({ matches }: { matches: ScheduleMatch[] }) {
  const fallbackSchedule = Array.from({ length: 4 }, (_, index) => ({
    id: `public-tbd-match-${index + 1}`,
    stageType: "group",
    groupName: `Group ${String.fromCharCode(65 + index)}`,
    roundNumber: 1,
    matchNumber: index + 1,
    status: "TBD",
    scheduledAt: null,
    scoreA: null,
    scoreB: null,
    bestOf: 1,
    participantA: null,
    participantB: null,
  }));
  const schedule = (matches.length > 0 ? matches : fallbackSchedule).sort(
    (a, b) => {
      if (!a.scheduledAt && !b.scheduledAt) {
        return a.matchNumber - b.matchNumber;
      }

      if (!a.scheduledAt) {
        return 1;
      }

      if (!b.scheduledAt) {
        return -1;
      }

      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    },
  );
  const completedCount = schedule.filter(
    (match) => match.status === "completed",
  ).length;
  const activeSchedule = schedule.filter(
    (match) => match.status !== "completed",
  );
  const completedSchedule = schedule.filter(
    (match) => match.status === "completed",
  );
  const groupedSchedule = groupSchedule(activeSchedule);
  const groupedResults = groupSchedule(completedSchedule);
  const finalRound = Math.max(
    0,
    ...schedule
      .filter((match) => match.stageType === "playoff")
      .map((match) => match.roundNumber ?? 0),
  );

  const scheduleTabId = "match-schedule-tab";
  const resultsTabId = "match-results-tab";

  return (
    <section className="match-schedule-tabs relative overflow-hidden rounded-lg border border-primary/15 bg-card/80 shadow-xl shadow-black/10">
      <style>{`
        .match-schedule-tabs [data-tab-panel="results"] {
          display: none;
        }

        .match-schedule-tabs:has(#${resultsTabId}:checked) [data-tab-panel="schedule"] {
          display: none;
        }

        .match-schedule-tabs:has(#${resultsTabId}:checked) [data-tab-panel="results"] {
          display: block;
        }

        .match-schedule-tabs:has(#${resultsTabId}:checked) [data-tab-label="schedule"] {
          border-bottom-color: transparent;
          color: var(--muted-foreground);
        }

        .match-schedule-tabs:has(#${resultsTabId}:checked) [data-tab-label="results"] {
          border-bottom-color: var(--primary);
          color: var(--primary);
        }
      `}</style>
      <input
        className="sr-only"
        defaultChecked
        id={scheduleTabId}
        name="match-schedule-tabs"
        type="radio"
      />
      <input
        className="sr-only"
        id={resultsTabId}
        name="match-schedule-tabs"
        type="radio"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(0,255,170,0.12),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(56,189,248,0.12),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="relative flex flex-col gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5 sm:py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-md border border-primary/25 bg-primary/10 shadow-[0_0_18px_rgba(0,255,170,0.12)]">
            <CalendarClock className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold">Match Schedule</h2>
            <p className="mt-1 text-sm text-muted-foreground max-sm:hidden">
              Jadwal pertandingan group stage dan playoff.
            </p>
          </div>
        </div>
        <div className="flex w-fit overflow-hidden rounded-md border border-primary/20 bg-background/70 text-sm shadow-[0_0_18px_rgba(0,255,170,0.08)]">
          <label
            className="cursor-pointer border-b-2 border-primary px-4 py-2 font-bold text-primary transition"
            data-tab-label="schedule"
            htmlFor={scheduleTabId}
          >
            Schedule {activeSchedule.length}
          </label>
          <label
            className="cursor-pointer border-b-2 border-transparent px-4 py-2 text-muted-foreground transition"
            data-tab-label="results"
            htmlFor={resultsTabId}
          >
            Results {completedCount}
          </label>
        </div>
      </div>

      <div className="relative p-3 sm:p-5">
        <div data-tab-panel="schedule">
          {groupedSchedule.length > 0 ? (
            <MatchScheduleRows
              finalRound={finalRound}
              groupedMatches={groupedSchedule}
            />
          ) : (
            <p className="rounded-md border border-white/10 bg-background/55 px-3 py-3 text-sm text-muted-foreground">
              Belum ada match upcoming atau TBD.
            </p>
          )}
        </div>

        <div data-tab-panel="results">
          {groupedResults.length > 0 ? (
            <MatchScheduleRows
              finalRound={finalRound}
              groupedMatches={groupedResults}
            />
          ) : (
            <p className="rounded-md border border-white/10 bg-background/55 px-3 py-3 text-sm text-muted-foreground">
              Belum ada result match.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
