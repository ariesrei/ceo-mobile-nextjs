import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";

export default async function WarrantyPage() {
  await requireMenuPath("/account/warranty");
  const clientName = await getServerClientName();

  return (
    <AppShell title="Warranty" backHref="/account" clientName={clientName}>
      <Card>
        <p className="text-sm text-[var(--muted)]">
          Staff Warranty module placeholder. Full workflows will be added in a
          later phase; access is already gated by <code>warranties_access</code>.
        </p>
      </Card>
    </AppShell>
  );
}
