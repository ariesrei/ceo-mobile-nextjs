import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { HistoryBoard } from "@/components/HistoryBoard";
import { HistoryView, type HistoryResponse } from "@/components/wp-record-views";
import { showOpsAssetsUi } from "@/lib/app-profile";
import {
  getServerClientBranding,
  getServerClientName,
  requireAuth,
  requireMenuPath,
} from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

export default async function HistoryPage() {
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
        <HistoryBoard />
      </AppShell>
    );
  }

  await requireMenuPath("/account/history");
  const [result, clientName] = await Promise.all([
    wpFetchServer<HistoryResponse>("/app/history"),
    getServerClientName(),
  ]);

  return (
    <AppShell title="History" backHref="/account" clientName={clientName}>
      <ClientWpRecord
        path="/history"
        initial={result.data}
        error={result.error || "Unavailable."}
        as={HistoryView}
      />
    </AppShell>
  );
}
