import { AppShell } from "@/components/AppShell";
import { ReservationDetail } from "@/components/ReservationDetail";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

type Props = { params: Promise<{ id: string }> };

export default async function ReservationDetailPage({ params }: Props) {
  const { id } = await params;
  await requireMenuPath("/account/reservations");
  const branding = await getServerClientBranding();
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Reservation"
      backHref="/account/history?tab=reservations"
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ReservationDetail id={Number(id) || 0} />
    </AppShell>
  );
}
