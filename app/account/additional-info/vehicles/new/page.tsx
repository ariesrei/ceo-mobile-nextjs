import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { VehicleForm } from "@/components/VehicleForm";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";

export default async function NewVehiclePage() {
  await requireMenuPath("/account/additional-info");
  const clientName = await getServerClientName();

  return (
    <AppShell
      title="Add vehicle"
      subtitle="Submitted vehicles may require staff approval."
      backHref="/account/additional-info"
      clientName={clientName}
    >
      <Card>
        <VehicleForm />
      </Card>
    </AppShell>
  );
}
