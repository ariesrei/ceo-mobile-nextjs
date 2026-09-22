import { AppShell } from "@/components/AppShell";
import { VehicleForm } from "@/components/VehicleForm";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function NewAssetVehiclePage() {
  await requireAuth();
  if (!showOpsAssetsUi()) {
    redirect("/account/additional-info/vehicles/new");
  }
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Add Vehicle"
      subtitle="Submitted vehicles may require staff approval."
      layout="community"
      backHref="/account/assets"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <VehicleForm afterSaveHref="/account/assets" />
    </AppShell>
  );
}
