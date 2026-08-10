import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";

export default async function MaintenancePage() {
  await requireMenuPath("/account/maintenance");
  const clientName = await getServerClientName();

  return (
    <AppShell title="Maintenance" backHref="/account" clientName={clientName}>
      <Card>
        <p className="text-sm text-[var(--muted)]">
          Staff Maintenance module placeholder. Full workflows will be added in a
          later phase; access is already gated by <code>maintenance_access</code>.
        </p>
      </Card>
    </AppShell>
  );
}
