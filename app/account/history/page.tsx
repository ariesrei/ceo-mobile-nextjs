import { AppShell } from "@/components/AppShell";
import { HistoryLists } from "@/components/HistoryLists";
import { Card } from "@/components/ui/Card";
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
  const tabs = result.data?.tabs;

  return (
    <AppShell title="History" backHref="/account" clientName={clientName}>
      {!tabs ? (
        <Card>
          <p className="text-sm text-red-700">{result.error || "Unavailable."}</p>
        </Card>
      ) : (
        <HistoryLists guests={tabs.guests} reservations={tabs.reservations} />
      )}
    </AppShell>
  );
}
