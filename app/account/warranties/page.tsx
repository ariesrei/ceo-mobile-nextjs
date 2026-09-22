import { WarrantyHome } from "@/components/WarrantyHome";
import { getNavigation, isStaffMenuPath } from "@/lib/server-nav";

export default async function WarrantiesPage() {
  const nav = await getNavigation();
  return (
    <WarrantyHome isStaff={isStaffMenuPath(nav, "/account/warranties")} />
  );
}
