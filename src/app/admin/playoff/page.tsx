import { AdminShell, PlayoffControl } from "@/app/admin/_components";
import { getTournamentOverview } from "@/lib/tournament/data";

export default async function AdminPlayoffPage() {
  const overview = await getTournamentOverview();

  return (
    <AdminShell
      active="/admin/playoff"
      description="Generate bracket dan update hasil playoff."
      overview={overview}
      title="Playoff Control"
    >
      <PlayoffControl overview={overview} />
    </AdminShell>
  );
}
