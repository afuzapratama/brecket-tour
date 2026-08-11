import { AdminShell, TeamControl } from "@/app/admin/_components";
import { getTournamentOverview } from "@/lib/tournament/data";

export default async function AdminTeamsPage() {
  const overview = await getTournamentOverview();

  return (
    <AdminShell
      active="/admin/teams"
      description="Tambah peserta, logo, tag, country, dan seed."
      overview={overview}
      title="Team Control"
    >
      <TeamControl overview={overview} />
    </AdminShell>
  );
}
