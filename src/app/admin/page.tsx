import { AdminDashboard, AdminShell } from "@/app/admin/_components";
import { getTournamentOverview } from "@/lib/tournament/data";

export default async function AdminPage() {
  const overview = await getTournamentOverview();

  return (
    <AdminShell
      active="/admin"
      description="Pilih area kerja admin yang mau diatur."
      overview={overview}
      title="Admin Control"
    >
      <AdminDashboard overview={overview} />
    </AdminShell>
  );
}
