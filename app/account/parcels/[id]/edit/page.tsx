import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { StaffPathGate } from "@/components/StaffPathGate";
import { ParcelEditView } from "@/components/wp-record-views";
import type { ParcelItem } from "@/lib/parcels";
import {
  getServerClientBranding,
  requireMenuPath,
  staffMenuDecision,
} from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditParcelPage({ params }: Props) {
  const nav = await requireMenuPath("/account/parcels");
  const decision = staffMenuDecision(nav, "/account/parcels");
  if (decision === "resident") {
    redirect("/account/parcels");
  }
  const { id } = await params;
  const [result, branding] = await Promise.all([
    wpFetchServer<ParcelItem>(`/app/parcels/${id}`),
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Edit parcel"
      subtitle="Update delivery details"
      backHref="/account/parcels"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <StaffPathGate
        path="/account/parcels"
        confirmed={decision === "staff" || decision === "unknown"}
        fallbackHref="/account/parcels"
      >
        <ClientWpRecord
          path={`/parcels/${id}`}
          initial={result.data}
          error={result.error || "Parcel not found."}
          as={ParcelEditView}
        />
      </StaffPathGate>
    </AppShell>
  );
}
