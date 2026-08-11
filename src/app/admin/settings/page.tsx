import { AdminShell, SettingsControl } from "@/app/admin/_components";
import { getTournamentOverview } from "@/lib/tournament/data";

export default async function AdminSettingsPage() {
  const overview = await getTournamentOverview();

  return (
    <AdminShell
      active="/admin/settings"
      description="Atur nama turnamen, rules, status, dan Third Place Match."
      overview={overview}
      title="Tournament Settings"
    >
      <SettingsControl overview={overview} />
    </AdminShell>
  );
}
