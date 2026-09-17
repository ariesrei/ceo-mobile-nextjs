import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { HistoryLists } from "@/components/HistoryLists";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import type { ReservationItem } from "@/lib/types";

type HistoryResponse = {
  tabs: {
    guests?: {
      enabled: boolean;
      items: Array<{
        id: number;
        names: string;
        phone: string;
        check_in: string;
        check_out: string;
      }>;
    };
    reservations?: {
      enabled: boolean;
      items: ReservationItem[];
    };
  };
};

export default async function HistoryPage() {
  await requireMenuPath("/account/history");
  const [result, clientName] = await Promise.all([
    wpFetchServer<HistoryResponse>("/app/history"),
    getServerClientName(),
  ]);

  return (
    <AppShell title="History" backHref="/account" clientName={clientName}>
      <ClientWpRecord<HistoryResponse>
        path="/history"
        initial={result.data}
        error={result.error || "Unavailable."}
      >
        {(data) => (
          <HistoryLists
            guests={data.tabs?.guests}
            reservations={data.tabs?.reservations}
          />
        )}
      </ClientWpRecord>
    </AppShell>
  );
}
