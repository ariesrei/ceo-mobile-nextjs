import { WarrantySettings } from "@/components/WarrantySettings";
import { WarrantyShell } from "@/components/WarrantyShell";

export default function WarrantySettingsPage() {
  return (
    <WarrantyShell title="Warranty Settings" backHref="/account/warranties">
      <WarrantySettings />
    </WarrantyShell>
  );
}
