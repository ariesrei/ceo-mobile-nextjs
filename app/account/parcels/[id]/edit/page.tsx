import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { ParcelEditView } from "@/components/wp-record-views";
import type { ParcelItem } from "@/lib/parcels";
import {
  getServerClientBranding,
  isStaffMenuPath,
  requireMenuPath,
} from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditParcelPage({ params }: Props) {
  const nav = await requireMenuPath("/account/parcels");
  if (!isStaffMenuPath(nav, "/account/parcels")) {
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
      <ClientWpRecord
        path={`/parcels/${id}`}
        initial={result.data}
        error={result.error || "Parcel not found."}
        as={ParcelEditView}
      />
    </AppShell>
  );
}
