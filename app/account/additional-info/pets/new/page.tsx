import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PetForm } from "@/components/PetForm";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";

export default async function NewPetPage() {
  await requireMenuPath("/account/additional-info");
  const clientName = await getServerClientName();

  return (
    <AppShell
      title="Add pet"
      subtitle="Submitted pets may require staff approval."
      backHref="/account/additional-info"
      clientName={clientName}
    >
      <Card>
        <PetForm />
      </Card>
    </AppShell>
  );
}
