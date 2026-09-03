import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { WarrantyAssignForm } from "@/components/WarrantyAssignForm";
import { Card } from "@/components/ui/Card";
import type { WarrantyItem } from "@/lib/warranties";
import {
  getServerClientBranding,
  isStaffMenuPath,
  requireMenuPath,
} from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function AssignWarrantyPage({ params }: Props) {
  const { id } = await params;
  const nav = await requireMenuPath("/account/warranties");
  if (!isStaffMenuPath(nav, "/account/warranties")) {
    redirect("/account/warranties");
  }
  const [result, branding] = await Promise.all([
    wpFetchServer<WarrantyItem>(`/app/warranties/${id}`),
    getServerClientBranding(),
  ]);
  if (
    result.data &&
    (result.data.is_assigned || result.data.warranty_sources_subcontractors)
  ) {
    redirect("/account/warranties");
  }

  return (
    <AppShell
      title="Assign Subcontractor"
      subtitle="Subcontractor, trades, due date, and notes"
      backHref="/account/warranties"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      {result.data ? (
        <WarrantyAssignForm record={result.data} />
      ) : (
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {result.error || "Warranty not found."}
          </p>
        </Card>
      )}
    </AppShell>
  );
}
