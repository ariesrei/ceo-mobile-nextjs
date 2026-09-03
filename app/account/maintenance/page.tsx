import { AppShell } from "@/components/AppShell";
import { MaintenanceList } from "@/components/MaintenanceList";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function MaintenancePage() {
  await requireMenuPath("/account/maintenance");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Work Orders"
      subtitle="My requests and building work"
      backHref="/account"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <MaintenanceList />
    </AppShell>
  );
}
