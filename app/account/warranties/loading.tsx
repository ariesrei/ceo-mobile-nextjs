import { WarrantyHomeSkeleton } from "@/components/ui/ListState";

export default function WarrantiesLoading() {
  return (
    <div className="ceo-app ceo-warranty ceo-warranty-home ceo-warranty--with-nav mx-auto min-h-dvh w-full">
      <section className="ceo-warranty-hero ceo-warranty-hero--flat" aria-hidden>
        <header className="ceo-warranty-hero__bar">
          <div className="flex min-h-10 min-w-0 items-center gap-2.5" />
        </header>
        <div className="ceo-warranty-hero__greeting">
          <p className="ceo-warranty-hero__hello">&nbsp;</p>
          <p className="ceo-warranty-hero__name">&nbsp;</p>
        </div>
      </section>
      <div className="ceo-warranty-sheet">
        <WarrantyHomeSkeleton />
      </div>
    </div>
  );
}
