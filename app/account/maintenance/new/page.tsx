import { AppShell } from "@/components/AppShell";
import { MaintenanceForm } from "@/components/MaintenanceForm";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function NewMaintenancePage() {
  await requireMenuPath("/account/maintenance");
  const branding = await getServerClientBranding();
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="New request"
      subtitle={community ? undefined : "Create a work order"}
      backHref="/account/maintenance"
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <MaintenanceForm />
    </AppShell>
  );
}
