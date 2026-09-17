import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { ReservationList } from "@/components/ReservationList";
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

  return (
    <AppShell
      title="Reservations"
      subtitle="Upcoming bookings"
      backHref="/account"
      clientName={clientName}
    >
      <ClientWpRecord<ResResponse>
        path="/reservations?type=upcoming"
        initial={result.data}
        error={result.error}
      >
        {(data) => <ReservationList items={data.items || []} />}
      </ClientWpRecord>
    </AppShell>
  );
}
