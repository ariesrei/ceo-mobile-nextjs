import { WarrantyReports } from "@/components/WarrantyReports";
import { WarrantyShell } from "@/components/WarrantyShell";

export default function WarrantyReportsPage() {
  return (
    <WarrantyShell title="Reports" backHref="/account/warranties">
      <WarrantyReports />
    </WarrantyShell>
  );
}
