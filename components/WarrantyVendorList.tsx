"use client";

import { useEffect, useMemo, useState } from "react";
import type { WarrantyChoice, WarrantyItem } from "@/lib/warranties";
import { loadWarrantyClaims, loadWarrantyOptions } from "@/lib/helpers/warranties";
import { FastLink } from "./FastLink";
import { EmptyState } from "./ui/ListState";
import { SearchIcon, ChevronRightIcon } from "./ui/Icons";

/**
 * Vendors are WordPress users with the `sub_contractor` role, surfaced by
 * /app/warranties/options as {id, label} where the label is the company name.
 * There is no dedicated vendor endpoint, so the open-claim tally is counted
 * here from the same claim list the rest of the module already loads.
 */
export function WarrantyVendorList() {
  const [vendors, setVendors] = useState<WarrantyChoice[]>([]);
  const [openItems, setOpenItems] = useState<WarrantyItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadWarrantyOptions()
      .then((options) => {
        if (cancelled) return;
        setVendors(options?.subcontractors || []);
        setLoading(false);
        return loadWarrantyClaims("open", { perPage: 20 });
      })
      .then((open) => {
        if (!cancelled && open) setOpenItems(open.items);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openPerVendor = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of openItems) {
      const id = String(item.warranty_sources_subcontractors || "");
      if (!id || id === "0") continue;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    return counts;
  }, [openItems]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vendors;
    return vendors.filter((v) => v.label.toLowerCase().includes(term));
  }, [vendors, search]);

  return (
    <div className="space-y-4">
      <div className="ceo-claim-search">
        <span className="ceo-claim-search__icon-wrap" aria-hidden>
          <SearchIcon className="ceo-claim-search__icon" />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors…"
          aria-label="Search vendors"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="ceo-skel h-[60px] rounded-2xl" />
          <div className="ceo-skel h-[60px] rounded-2xl" />
          <div className="ceo-skel h-[60px] rounded-2xl" />
        </div>
      ) : visible.length ? (
        <nav className="ceo-warranty-menu">
          {visible.map((vendor) => {
            const id = String(vendor.id);
            const count = openPerVendor.get(id) || 0;
            return (
              <FastLink
                key={id}
                href={`/account/warranties/claims?tab=open&assignee=${encodeURIComponent(id)}`}
                className="ceo-warranty-menu__row"
              >
                <span className="ceo-vendor-mark" aria-hidden>
                  {vendor.label.slice(0, 1).toUpperCase()}
                </span>
                <span className="ceo-warranty-menu__label">{vendor.label}</span>
                <span className="ceo-warranty-menu__meta">
                  {count} open
                </span>
                <ChevronRightIcon className="ceo-warranty-menu__chev" />
              </FastLink>
            );
          })}
        </nav>
      ) : (
        <EmptyState
          icon={vendors.length ? "search" : "inbox"}
          subtitle={
            vendors.length
              ? "Try another name."
              : "Subcontractors will show up here."
          }
        >
          {vendors.length ? "No matching vendors" : "No vendors yet"}
        </EmptyState>
      )}
    </div>
  );
}
