import { WarrantyForm } from "@/components/WarrantyForm";
import { WarrantyShell } from "@/components/WarrantyShell";
import { Card } from "@/components/ui/Card";
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
      {result.data ? (
        <WarrantyForm record={result.data} sectioned />
      ) : (
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {result.error || "Warranty not found."}
          </p>
        </Card>
      )}
    </WarrantyShell>
  );
}
