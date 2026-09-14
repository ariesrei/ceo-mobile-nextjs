import { redirect } from "next/navigation";
import { WarrantyShell } from "@/components/WarrantyShell";
import { WarrantyStatusForm } from "@/components/WarrantyStatusForm";
import { Card } from "@/components/ui/Card";
import type { WarrantyItem } from "@/lib/warranties";
import { getNavigation, isStaffMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function WarrantyStatusPage({ params }: Props) {
  const { id } = await params;
  const nav = await getNavigation();
  if (!isStaffMenuPath(nav, "/account/warranties")) {
    redirect("/account/warranties");
  }
  const result = await wpFetchServer<WarrantyItem>(`/app/warranties/${id}`);

  return (
    <WarrantyShell
      title="Update Status"
      backHref={`/account/warranties/${id}`}
      showNav={false}
    >
      {result.data ? (
        <WarrantyStatusForm record={result.data} />
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
