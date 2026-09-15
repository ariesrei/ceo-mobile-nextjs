import { WarrantyForm } from "@/components/WarrantyForm";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function NewWarrantyPage() {
  await requireMenuPath("/account/warranties");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="New Warranty"
      subtitle="Submit a warranty request"
      backHref="/account/warranties"
      showNav={false}
    >
      <WarrantyForm />
    </WarrantyShell>
  );
}
