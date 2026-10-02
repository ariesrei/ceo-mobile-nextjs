import { WarrantyHomeSkeleton } from "@/components/ui/ListState";

export default function WarrantiesLoading() {
  return (
    <div className="ceo-app mx-auto min-h-dvh w-full pb-28">
      <div className="ceo-skel h-[38dvh] w-full" />
      <div className="-mt-8 px-[var(--app-pad)]">
        <WarrantyHomeSkeleton />
      </div>
    </div>
  );
}
