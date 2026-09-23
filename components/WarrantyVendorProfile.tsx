"use client";

import { useEffect, useMemo, useState } from "react";
import type { WarrantyChoice, WarrantyItem } from "@/lib/warranties";
import { loadWarrantyClaims, loadWarrantyOptions } from "@/lib/helpers/warranties";
import { ClaimThumb, claimContactName, claimMetaLines, claimThumbSrc } from "./ClaimThumb";
import { FastLink } from "./FastLink";
import { EmptyState, ListSkeleton } from "./ui/ListState";
import { StatusBadge } from "./ui/StatusBadge";

export function WarrantyVendorProfile({ vendorId }: { vendorId: string }) {
  const [vendor, setVendor] = useState<WarrantyChoice | null>(null);
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadWarrantyOptions(),
      loadWarrantyClaims("all", { perPage: 50 }),
    ])
      .then(([options, claims]) => {
        if (cancelled) return;
        const match = (options?.subcontractors || []).find(
          (row) => String(row.id) === vendorId
        );
        setVendor(match || { id: vendorId, label: "Vendor" });
        setItems(
          claims.items.filter(
            (item) => String(item.warranty_sources_subcontractors || "") === vendorId
          )
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      open: items.filter((item) => !/complete|closed|done/i.test(item.status_label || "")).length,
    };
  }, [items]);

  if (loading) return <ListSkeleton rows={3} height={78} />;
  if (!vendor) return <EmptyState>Vendor not found.</EmptyState>;

  return (
    <div className="space-y-4">
      <section className="ceo-vendor-profile">
        <span className="ceo-vendor-mark" aria-hidden>
          {vendor.label.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="ceo-vendor-profile__name">{vendor.label}</p>
          <p className="text-sm text-[var(--muted)]">
            {counts.total
              ? `${counts.open} open · ${counts.total} claims`
              : "No assigned claims yet."}
          </p>
        </div>
      </section>

      {items.length ? (
        <ul className="space-y-2">
          {items.map((item) => {
            const title =
              item.warranty_describe_the_request ||
              item.warranty_describe_the_request_single ||
              item.title;
            return (
              <li key={item.id}>
                <FastLink
                  href={`/account/warranties/${item.id}`}
                  className="ceo-claim-card"
                >
                  <ClaimThumb
                    src={claimThumbSrc(item)}
                    name={claimContactName(item)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="ceo-claim-card__id">#{item.id}</p>
                    <p className="ceo-claim-card__title">{title}</p>
                    {claimMetaLines(item, title).length ? (
                      <div className="ceo-claim-card__meta">
                        {claimMetaLines(item, title).map((line, i) => (
                          <span key={`${i}-${line}`}>{line}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {item.status_label ? (
                    <StatusBadge
                      label={item.status_label}
                      color={item.status_color}
                    />
                  ) : null}
                </FastLink>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState subtitle="Claims assigned to this vendor will show here.">
          No claims yet
        </EmptyState>
      )}
    </div>
  );
}
