import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { StaffPathGate } from "@/components/StaffPathGate";
import { GuestEditView } from "@/components/wp-record-views";
import { showOpsAssetsUi } from "@/lib/app-profile";
import type { GuestItem } from "@/lib/guests";
import {
  getServerClientBranding,
  requireMenuPath,
  staffMenuDecision,
} from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditGuestPage({ params }: Props) {
  const nav = await requireMenuPath("/account/guests");
  const decision = staffMenuDecision(nav, "/account/guests");
  if (decision === "resident") {
    redirect("/account/history?tab=guests");
  }
  const { id } = await params;
  const [result, branding] = await Promise.all([
    wpFetchServer<GuestItem>(`/app/guests/${id}`),
    getServerClientBranding(),
  ]);
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Edit guest"
      subtitle={community ? undefined : "Update visit details"}
      backHref="/account/guests"
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <StaffPathGate
        path="/account/guests"
        confirmed={decision === "staff" || decision === "unknown"}
        fallbackHref="/account/history?tab=guests"
      >
        <ClientWpRecord
          path={`/guests/${id}`}
          initial={result.data}
          error={result.error || "Guest not found."}
          as={GuestEditView}
        />
      </StaffPathGate>
    </AppShell>
  );
}
