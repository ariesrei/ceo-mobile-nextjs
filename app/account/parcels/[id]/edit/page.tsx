import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { ParcelForm } from "@/components/ParcelForm";
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
      <ClientWpRecord<ParcelItem>
        path={`/parcels/${id}`}
        initial={result.data}
        error={result.error || "Parcel not found."}
      >
        {(parcel) => (
          <Card>
            <ParcelForm parcel={parcel} />
          </Card>
        )}
      </ClientWpRecord>
    </AppShell>
  );
}
