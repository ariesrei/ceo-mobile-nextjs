import { WarrantyForm } from "@/components/WarrantyForm";
import { WarrantyShell } from "@/components/WarrantyShell";
import { getNavigation, isStaffMenuPath } from "@/lib/server-nav";

export default async function NewWarrantyPage() {
  const nav = await getNavigation();
  const isStaff = isStaffMenuPath(nav, "/account/warranties");

  return (
    <WarrantyShell
      title="Create Claim"
      subtitle={isStaff ? undefined : "Submit a warranty request"}
      backHref="/account/warranties"
      showNav={false}
    >
      <WarrantyForm />
    </WarrantyShell>
  );
}
