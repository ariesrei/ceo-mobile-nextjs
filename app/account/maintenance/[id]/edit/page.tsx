import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { MaintenanceView } from "@/components/wp-record-views";
import type { MaintenanceItem } from "@/lib/maintenance";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function EditMaintenancePage({ params }: Props) {
  const { id } = await params;
  await requireMenuPath("/account/maintenance");
  const [result, branding] = await Promise.all([
    wpFetchServer<MaintenanceItem>(`/app/maintenance/${id}`),
    getServerClientBranding(),
  ]);

  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Edit maintenance"
      subtitle={community ? undefined : "Update request details"}
      backHref="/account/maintenance"
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ClientWpRecord
        path={`/maintenance/${id}`}
        initial={result.data}
        error={result.error || "Maintenance record not found."}
        as={MaintenanceView}
      />
    </AppShell>
  );
}
