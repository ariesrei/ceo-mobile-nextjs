import { WarrantyClaimDetail } from "@/components/WarrantyClaimDetail";
import { WarrantyShell } from "@/components/WarrantyShell";
import { Card } from "@/components/ui/Card";
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
      {result.data ? (
        <WarrantyClaimDetail
          record={result.data}
          canEdit={Boolean(result.data.can_edit)}
          isStaff={isStaff}
        />
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
