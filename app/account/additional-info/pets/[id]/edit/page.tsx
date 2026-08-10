import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PetForm } from "@/components/PetForm";
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
      {!result.data ? (
        <Card>
          <p className="text-sm text-red-700">{result.error || "Pet not found."}</p>
        </Card>
      ) : (
        <Card>
          <PetForm pet={result.data} />
        </Card>
      )}
    </AppShell>
  );
}
