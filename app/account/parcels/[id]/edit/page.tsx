import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
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
      {!result.data ? (
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {result.error || "Parcel not found."}
          </p>
        </Card>
      ) : (
        <Card>
          <ParcelForm parcel={result.data} />
        </Card>
      )}
    </AppShell>
  );
}
