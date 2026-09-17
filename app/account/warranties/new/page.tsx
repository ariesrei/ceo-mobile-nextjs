import { WarrantyForm } from "@/components/WarrantyForm";
import { WarrantyShell } from "@/components/WarrantyShell";
import { requireMenuPath } from "@/lib/server-nav";

export default async function NewWarrantyPage() {
  await requireMenuPath("/account/warranties");

  return (
    <WarrantyShell
      title="New Warranty"
      subtitle="Submit a warranty request"
      backHref="/account/warranties"
      showNav={false}
    >
      <WarrantyForm />
    </WarrantyShell>
  );
}
