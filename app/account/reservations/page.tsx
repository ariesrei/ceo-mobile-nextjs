import { AppShell } from "@/components/AppShell";
import { ReservationList } from "@/components/ReservationList";
import { Card } from "@/components/ui/Card";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";
import type { ReservationItem } from "@/lib/types";

type ResResponse = { type: string; items: ReservationItem[] };

export default async function ReservationsPage() {
  await requireMenuPath("/account/reservations");
  const [result, clientName] = await Promise.all([
    wpFetchServer<ResResponse>("/app/reservations?type=upcoming"),
    getServerClientName(),
  ]);
  const items = result.data?.items || [];

  return (
    <AppShell
      title="Reservations"
      subtitle="Upcoming bookings"
      backHref="/account"
      clientName={clientName}
    >
      {!result.data && result.error ? (
        <Card>
          <p className="text-sm text-red-700">{result.error}</p>
        </Card>
      ) : (
        <ReservationList items={items} />
      )}
    </AppShell>
  );
}
