import { AdminShell, GroupControl } from "@/app/admin/_components";
import { getTournamentOverview } from "@/lib/tournament/data";

export default async function AdminGroupsPage() {
  const overview = await getTournamentOverview();

  return (
    <AdminShell
      active="/admin/groups"
      description="Buat group, assign team, dan input TM."
      overview={overview}
      title="Group Control"
    >
      <GroupControl overview={overview} />
    </AdminShell>
  );
}
