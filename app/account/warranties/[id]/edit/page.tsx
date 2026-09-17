import { ClientWpRecord } from "@/components/ClientWpRecord";
import { WarrantyForm } from "@/components/WarrantyForm";
import { WarrantyShell } from "@/components/WarrantyShell";
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
      <ClientWpRecord<WarrantyItem>
        path={`/warranties/${id}`}
        initial={result.data}
        error={result.error || "Warranty not found."}
      >
        {(record) => <WarrantyForm record={record} sectioned />}
      </ClientWpRecord>
    </WarrantyShell>
  );
}
