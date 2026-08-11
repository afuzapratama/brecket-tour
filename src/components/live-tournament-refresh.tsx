"use client";

import { useEffect, useRef, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const realtimeTables = [
  "tournaments",
  "tournament_participants",
  "teams",
  "groups",
  "group_participants",
  "matches",
  "match_games",
  "standings_snapshots",
  "brackets",
  "bracket_slots",
];

export function LiveTournamentRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel("public-tournament-live");

    realtimeTables.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        () => {
          if (refreshTimer.current) {
            clearTimeout(refreshTimer.current);
          }

          refreshTimer.current = setTimeout(() => {
            startTransition(() => {
              router.refresh();
            });
          }, 250);
        },
      );
    });

    channel.subscribe();

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }

      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-md border border-white/10 bg-card/90 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-2xl shadow-black/30">
      <RefreshCw className={isPending ? "size-3 animate-spin" : "size-3"} />
      Live sync
    </div>
  );
}
