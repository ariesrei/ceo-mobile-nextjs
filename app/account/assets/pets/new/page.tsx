import { AppShell } from "@/components/AppShell";
import { PetForm } from "@/components/PetForm";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function NewAssetPetPage() {
  await requireAuth();
  if (!showOpsAssetsUi()) redirect("/account/additional-info/pets/new");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Add Pet"
      subtitle="Submitted pets may require staff approval."
      layout="community"
      backHref="/account/assets"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <PetForm afterSaveHref="/account/assets" />
    </AppShell>
  );
}
