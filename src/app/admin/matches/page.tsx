import { AdminShell, MatchControl } from "@/app/admin/_components";
import { getTournamentOverview } from "@/lib/tournament/data";

export default async function AdminMatchesPage() {
  const overview = await getTournamentOverview();

  return (
    <AdminShell
      active="/admin/matches"
      description="Input score, kill difference, status, dan jadwal."
      overview={overview}
      title="Match Control"
    >
      <MatchControl overview={overview} />
    </AdminShell>
  );
}
