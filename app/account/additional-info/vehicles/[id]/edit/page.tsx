import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { VehicleEditView } from "@/components/wp-record-views";
import type { VehicleItem } from "@/lib/additional-info";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function EditVehiclePage({ params }: Props) {
  await requireMenuPath("/account/additional-info");
  const { id } = await params;
  const [result, clientName] = await Promise.all([
    wpFetchServer<VehicleItem>(`/app/additional-info/vehicles/${id}`),
    getServerClientName(),
  ]);

  return (
    <AppShell
      title="Edit vehicle"
      subtitle="Updates may require staff approval."
      backHref="/account/additional-info"
      clientName={clientName}
    >
      <ClientWpRecord
        path={`/additional-info/vehicles/${id}`}
        initial={result.data}
        error={result.error || "Vehicle not found."}
        as={VehicleEditView}
      />
    </AppShell>
  );
}
