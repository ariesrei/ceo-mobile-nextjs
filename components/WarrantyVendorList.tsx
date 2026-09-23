"use client";

import { useEffect, useMemo, useState } from "react";
import type { WarrantyChoice, WarrantyItem } from "@/lib/warranties";
import { vendorClaimCountLabel } from "@/lib/warranties";
import {
  loadAllWarrantyClaims,
  loadWarrantyOptions,
} from "@/lib/helpers/warranties";
import { FastLink } from "./FastLink";
import { EmptyState, ListSkeleton } from "./ui/ListState";
import { SearchIcon, ChevronRightIcon } from "./ui/Icons";

export function WarrantyVendorList() {
  const [vendors, setVendors] = useState<WarrantyChoice[]>([]);
  const [claims, setClaims] = useState<WarrantyItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadWarrantyOptions(),
      loadAllWarrantyClaims("open"),
      loadAllWarrantyClaims("closed"),
    ])
      .then(([options, open, closed]) => {
        if (cancelled) return;
        setVendors(options?.subcontractors || []);
        const seen = new Set<number>();
        setClaims(
          [...open, ...closed].filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          })
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const claimsPerVendor = useMemo(() => {
    const map = new Map<string, WarrantyItem[]>();
    for (const item of claims) {
      const id = String(item.warranty_sources_subcontractors || "");
      if (!id || id === "0") continue;
      const rows = map.get(id) || [];
      rows.push(item);
      map.set(id, rows);
    }
    return map;
  }, [claims]);

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
        <ListSkeleton rows={4} height={60} />
      ) : visible.length ? (
        <nav className="ceo-warranty-menu">
          {visible.map((vendor) => {
            const id = String(vendor.id);
            return (
              <FastLink
                key={id}
                href={`/account/warranties/vendors/${encodeURIComponent(id)}`}
                className="ceo-warranty-menu__row"
              >
                <span className="ceo-vendor-mark" aria-hidden>
                  {vendor.label.slice(0, 1).toUpperCase()}
                </span>
                <span className="ceo-warranty-menu__label">{vendor.label}</span>
                <span className="ceo-warranty-menu__meta">
                  {vendorClaimCountLabel(claimsPerVendor.get(id) || [])}
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
