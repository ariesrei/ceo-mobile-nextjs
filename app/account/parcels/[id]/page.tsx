import { AppShell } from "@/components/AppShell";
import { ParcelDetail } from "@/components/ParcelDetail";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

type Props = { params: Promise<{ id: string }> };

export default async function ParcelDetailPage({ params }: Props) {
  await requireMenuPath("/account/parcels");
  const [{ id }, branding] = await Promise.all([
    params,
    getServerClientBranding(),
  ]);
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Package"
      layout={community ? "community" : "default"}
      backHref="/account/parcels"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ParcelDetail parcelId={Number(id) || 0} />
    </AppShell>
  );
}
