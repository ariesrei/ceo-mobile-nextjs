import { redirect } from "next/navigation";
import { ClientWpRecord } from "@/components/ClientWpRecord";
import { WarrantyShell } from "@/components/WarrantyShell";
import { WarrantyStatusView } from "@/components/wp-record-views";
import type { WarrantyItem } from "@/lib/warranties";
import { WarrantyStaffGate } from "@/components/WarrantyStaffGate";
import { getNavigation, staffMenuDecision } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function WarrantyStatusPage({ params }: Props) {
  const { id } = await params;
  const nav = await getNavigation();
  const decision = staffMenuDecision(nav, "/account/warranties");
  if (decision === "resident") {
    redirect("/account/warranties");
  }
  const result = await wpFetchServer<WarrantyItem>(`/app/warranties/${id}`);

  return (
    <WarrantyShell
      title="Update Status"
      backHref={`/account/warranties/${id}`}
      showNav={false}
    >
      <WarrantyStaffGate
        confirmed={decision === "staff"}
        fallbackHref={`/account/warranties/${id}`}
      >
        <ClientWpRecord
          path={`/warranties/${id}`}
          initial={result.data}
          error={result.error || "Warranty not found."}
          as={WarrantyStatusView}
        />
      </WarrantyStaffGate>
    </WarrantyShell>
  );
}
