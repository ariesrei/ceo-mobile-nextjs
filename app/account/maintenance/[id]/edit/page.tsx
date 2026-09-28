import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { StaffPathGate } from "@/components/StaffPathGate";
import { MaintenanceView } from "@/components/wp-record-views";
import type { MaintenanceItem } from "@/lib/maintenance";
import { showOpsAssetsUi } from "@/lib/app-profile";
import {
  getServerClientBranding,
  requireMenuPath,
  staffMenuDecision,
} from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditMaintenancePage({ params }: Props) {
  const { id } = await params;
  const nav = await requireMenuPath("/account/maintenance");
  const decision = staffMenuDecision(nav, "/account/maintenance");
  if (decision === "resident") {
    redirect(`/account/maintenance/${id}`);
  }
  const [result, branding] = await Promise.all([
    wpFetchServer<MaintenanceItem>(`/app/maintenance/${id}`),
    getServerClientBranding(),
  ]);
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Edit work order"
      subtitle={community ? undefined : "Update request"}
      backHref={`/account/maintenance/${id}`}
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <StaffPathGate
        path="/account/maintenance"
        confirmed={decision === "staff" || decision === "unknown"}
        fallbackHref={`/account/maintenance/${id}`}
      >
        <ClientWpRecord
          path={`/maintenance/${id}`}
          initial={result.data}
          error={result.error || "Maintenance record not found."}
          as={MaintenanceView}
        />
      </StaffPathGate>
    </AppShell>
  );
}
