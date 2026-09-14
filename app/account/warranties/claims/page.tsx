import { FastLink } from "@/components/FastLink";
import { WarrantyList } from "@/components/WarrantyList";
import { WarrantyShell } from "@/components/WarrantyShell";
import { PlusIcon } from "@/components/ui/Icons";

type Props = {
  searchParams: Promise<{ tab?: string; assignee?: string; filters?: string }>;
};

export default async function WarrantyClaimsPage({ searchParams }: Props) {
  const { tab, assignee, filters } = await searchParams;

  return (
    <WarrantyShell
      title="Claims"
      backHref="/account/warranties"
      action={
        <FastLink
          href="/account/warranties/new"
          className="ceo-warranty-iconbtn"
          aria-label="Create Claim"
        >
          <PlusIcon className="h-5 w-5" />
        </FastLink>
      }
    >
      <WarrantyList
        initialTab={tab}
        initialAssignee={assignee}
        initialShowFilters={filters === "1"}
      />
    </WarrantyShell>
  );
}
