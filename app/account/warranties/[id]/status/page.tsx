import { redirect } from "next/navigation";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { WarrantyShell } from "@/components/WarrantyShell";
import { WarrantyStatusForm } from "@/components/WarrantyStatusForm";
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
      <ClientWpRecord<WarrantyItem>
        path={`/warranties/${id}`}
        initial={result.data}
        error={result.error || "Warranty not found."}
      >
        {(record) => <WarrantyStatusForm record={record} />}
      </ClientWpRecord>
    </WarrantyShell>
  );
}
