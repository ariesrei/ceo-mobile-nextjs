import { AppShell } from "@/components/AppShell";
import { WarrantyForm } from "@/components/WarrantyForm";
import {
  getServerClientBranding,
  isStaffMenuPath,
  requireMenuPath,
} from "@/lib/server-nav";

export default async function NewWarrantyPage() {
  const nav = await requireMenuPath("/account/warranties");
  const branding = await getServerClientBranding();
  const isStaff = isStaffMenuPath(nav, "/account/warranties");

  return (
    <AppShell
      title={isStaff ? "Create ticket" : "New claim"}
      subtitle={
        isStaff
          ? "Status is set to New Warranty Approved"
          : "Submit a warranty request"
      }
      backHref="/account/warranties"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <WarrantyForm />
    </AppShell>
  );
}
