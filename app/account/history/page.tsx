import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { HistoryView, type HistoryResponse } from "@/components/wp-record-views";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

export default async function HistoryPage() {
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
