import { ClientWpRecord } from "@/components/ClientWpRecord";
import { WarrantyShell } from "@/components/WarrantyShell";
import { WarrantyFormView } from "@/components/wp-record-views";
import type { WarrantyItem } from "@/lib/warranties";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function EditWarrantyPage({ params }: Props) {
  const { id } = await params;
  const result = await wpFetchServer<WarrantyItem>(`/app/warranties/${id}`);

  return (
    <WarrantyShell
      title="Edit Claim"
      backHref={`/account/warranties/${id}`}
      showNav={false}
    >
      <ClientWpRecord
        path={`/warranties/${id}`}
        initial={result.data}
        error={result.error || "Warranty not found."}
        as={WarrantyFormView}
      />
    </WarrantyShell>
  );
}
