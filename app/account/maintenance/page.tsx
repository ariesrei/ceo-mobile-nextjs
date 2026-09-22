import { AppShell } from "@/components/AppShell";
import { MaintenanceList } from "@/components/MaintenanceList";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function MaintenancePage() {
  await requireMenuPath("/account/maintenance");
  const branding = await getServerClientBranding();
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Work Orders"
      subtitle={community ? undefined : "Work orders"}
      backHref={community ? undefined : "/account"}
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <MaintenanceList />
    </AppShell>
  );
}
