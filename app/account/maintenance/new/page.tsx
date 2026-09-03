import { AppShell } from "@/components/AppShell";
import { MaintenanceForm } from "@/components/MaintenanceForm";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function NewMaintenancePage() {
  await requireMenuPath("/account/maintenance");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="New request"
      subtitle="Create a work order"
      backHref="/account/maintenance"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <MaintenanceForm />
    </AppShell>
  );
}
