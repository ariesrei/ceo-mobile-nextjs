import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ParcelForm } from "@/components/ParcelForm";
import type { ParcelItem } from "@/lib/parcels";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function EditParcelPage({ params }: Props) {
  await requireMenuPath("/account/parcels");
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
          <p className="text-sm text-red-700">
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
