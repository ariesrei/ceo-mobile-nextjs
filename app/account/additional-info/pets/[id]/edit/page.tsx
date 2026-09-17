import { AppShell } from "@/components/AppShell";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { PetEditView } from "@/components/wp-record-views";
import type { PetItem } from "@/lib/additional-info";
import { getServerClientName, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function EditPetPage({ params }: Props) {
  await requireMenuPath("/account/additional-info");
  const { id } = await params;
  const [result, clientName] = await Promise.all([
    wpFetchServer<PetItem>(`/app/additional-info/pets/${id}`),
    getServerClientName(),
  ]);

  return (
    <AppShell
      title="Edit pet"
      subtitle="Updates may require staff approval."
      backHref="/account/additional-info"
      clientName={clientName}
    >
      <ClientWpRecord
        path={`/additional-info/pets/${id}`}
        initial={result.data}
        error={result.error || "Pet not found."}
        as={PetEditView}
      />
    </AppShell>
  );
}
