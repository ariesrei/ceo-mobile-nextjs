import { AppShell } from "@/components/AppShell";
import { MaintenanceForm } from "@/components/MaintenanceForm";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function NewMaintenancePage() {
  await requireMenuPath("/account/maintenance");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="New maintenance"
      subtitle="Create a maintenance request"
      backHref="/account/maintenance"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <MaintenanceForm />
    </AppShell>
  );
}
