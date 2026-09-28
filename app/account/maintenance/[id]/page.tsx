import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { MaintenanceDetailView } from "@/components/wp-record-views";
import type { MaintenanceItem } from "@/lib/maintenance";
import { showOpsAssetsUi } from "@/lib/app-profile";
import {
  getServerClientBranding,
  isStaffMenuPath,
  requireMenuPath,
} from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function MaintenanceDetailPage({ params }: Props) {
  const { id } = await params;
  const nav = await requireMenuPath("/account/maintenance");
  const [result, branding] = await Promise.all([
    wpFetchServer<MaintenanceItem>(`/app/maintenance/${id}`),
    getServerClientBranding(),
  ]);
  const community = showOpsAssetsUi();
  const isStaff = isStaffMenuPath(nav, "/account/maintenance");

  return (
    <AppShell
      title="Work order"
      subtitle={community ? undefined : "Request details"}
      backHref="/account/maintenance"
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ClientWpRecord<MaintenanceItem, { isStaff: boolean }>
        path={`/maintenance/${id}`}
        initial={result.data}
        error={result.error || "Maintenance record not found."}
        as={MaintenanceDetailView}
        extra={{ isStaff }}
      />
    </AppShell>
  );
}
