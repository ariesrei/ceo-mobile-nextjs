import { redirect } from "next/navigation";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { WarrantyAssignForm } from "@/components/WarrantyAssignForm";
import { WarrantyShell } from "@/components/WarrantyShell";
import type { WarrantyItem } from "@/lib/warranties";
import { getNavigation, isStaffMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function AssignWarrantyPage({ params }: Props) {
  const { id } = await params;
  const nav = await getNavigation();
  if (!isStaffMenuPath(nav, "/account/warranties")) {
    redirect("/account/warranties");
  }
  const result = await wpFetchServer<WarrantyItem>(`/app/warranties/${id}`);

  return (
    <WarrantyShell
      title="Assign Subcontractor"
      backHref={`/account/warranties/${id}`}
      dismiss
      showNav={false}
    >
      <ClientWpRecord<WarrantyItem>
        path={`/warranties/${id}`}
        initial={result.data}
        error={result.error || "Warranty not found."}
      >
        {(record) => <WarrantyAssignForm record={record} />}
      </ClientWpRecord>
    </WarrantyShell>
  );
}
