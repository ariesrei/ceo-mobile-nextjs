import { AppShell } from "@/components/AppShell";
import { OpsPetEdit } from "@/components/AssetsRecordViews";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import type { PetItem } from "@/lib/additional-info";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditAssetPetPage({ params }: Props) {
  await requireAuth();
  const { id } = await params;
  if (!showOpsAssetsUi()) {
    redirect(`/account/additional-info/pets/${id}/edit`);
  }
  const [result, branding] = await Promise.all([
    wpFetchServer<PetItem>(`/app/additional-info/pets/${id}`),
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Edit Pet"
      subtitle="Updates may require staff approval."
      layout="community"
      backHref="/account/assets"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ClientWpRecord
        path={`/additional-info/pets/${id}`}
        initial={result.data}
        error={result.error || "Pet not found."}
        as={OpsPetEdit}
      />
    </AppShell>
  );
}
