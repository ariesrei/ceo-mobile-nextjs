import { AppShell } from "@/components/AppShell";
import { HistoryBoard } from "@/components/HistoryBoard";
import { showOpsAssetsUi } from "@/lib/app-profile";
import {
  getServerClientBranding,
  getServerClientName,
  requireAuth,
  requireMenuPath,
} from "@/lib/server-nav";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  if (showOpsAssetsUi()) {
    await requireAuth();
    const branding = await getServerClientBranding();
    return (
      <AppShell
        title="History"
        layout="community"
        clientName={branding.name}
        clientLogo={branding.logo}
      >
        <HistoryBoard initialTab={tab} />
      </AppShell>
    );
  }

  await requireMenuPath("/account/history");
  const clientName = await getServerClientName();

  return (
    <AppShell title="History" backHref="/account" clientName={clientName}>
      <HistoryBoard initialTab={tab} />
    </AppShell>
  );
}
