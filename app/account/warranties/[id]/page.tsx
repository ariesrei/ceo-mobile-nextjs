import { ClientWpRecord } from "@/components/ClientWpRecord";
import { WarrantyClaimDetail } from "@/components/WarrantyClaimDetail";
import { WarrantyShell } from "@/components/WarrantyShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { WarrantyItem } from "@/lib/warranties";
import { getNavigation, isStaffMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function WarrantyDetailPage({ params }: Props) {
  const { id } = await params;
  const [result, nav] = await Promise.all([
    wpFetchServer<WarrantyItem>(`/app/warranties/${id}`),
    getNavigation(),
  ]);
  const isStaff = isStaffMenuPath(nav, "/account/warranties");

  return (
    <WarrantyShell
      title={result.data ? `Claim #${result.data.id}` : "Claim"}
      backHref="/account/warranties/claims"
      dismiss
      showNav={false}
      action={
        result.data?.status_label ? (
          <StatusBadge label={result.data.status_label} short />
        ) : undefined
      }
    >
      <ClientWpRecord<WarrantyItem>
        path={`/warranties/${id}`}
        initial={result.data}
        error={result.error || "Warranty not found."}
      >
        {(record) => (
          <WarrantyClaimDetail
            record={record}
            canEdit={Boolean(record.can_edit)}
            isStaff={isStaff}
          />
        )}
      </ClientWpRecord>
    </WarrantyShell>
  );
}
