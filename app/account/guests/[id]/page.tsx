import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { GuestDetailView } from "@/components/wp-record-views";
import { showOpsAssetsUi } from "@/lib/app-profile";
import type { GuestItem } from "@/lib/guests";
import {
  getServerClientBranding,
  isStaffMenuPath,
  requireMenuPath,
} from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function GuestDetailPage({ params }: Props) {
  const { id } = await params;
  const nav = await requireMenuPath("/account/guests");
  const [result, branding] = await Promise.all([
    wpFetchServer<GuestItem>(`/app/guests/${id}`),
    getServerClientBranding(),
  ]);
  const community = showOpsAssetsUi();
  const isStaff = isStaffMenuPath(nav, "/account/guests");

  return (
    <AppShell
      title="Guest"
      backHref={isStaff ? "/account/guests" : "/account/history?tab=guests"}
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ClientWpRecord<GuestItem, { isStaff: boolean }>
        path={`/guests/${id}`}
        initial={result.data}
        error={result.error || "Guest not found."}
        as={GuestDetailView}
        extra={{ isStaff }}
      />
    </AppShell>
  );
}
