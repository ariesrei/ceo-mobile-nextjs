import { AppShell } from "@/components/AppShell";
import { OpsVehicleEdit } from "@/components/AssetsRecordViews";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import type { VehicleItem } from "@/lib/additional-info";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditAssetVehiclePage({ params }: Props) {
  await requireAuth();
  const { id } = await params;
  if (!showOpsAssetsUi()) {
    redirect(`/account/additional-info/vehicles/${id}/edit`);
  }
  const [result, branding] = await Promise.all([
    wpFetchServer<VehicleItem>(`/app/additional-info/vehicles/${id}`),
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Edit Vehicle"
      subtitle="Updates may require staff approval."
      layout="community"
      backHref="/account/assets"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ClientWpRecord
        path={`/additional-info/vehicles/${id}`}
        initial={result.data}
        error={result.error || "Vehicle not found."}
        as={OpsVehicleEdit}
      />
    </AppShell>
  );
}
