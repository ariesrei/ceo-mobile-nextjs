"use client";

import { useEffect, useMemo, useState } from "react";
import type { WarrantyItem, WarrantyVendor } from "@/lib/warranties";
import {
  isWarrantyExpiring,
  vendorClaimCountLabel,
} from "@/lib/warranties";
import {
  loadAllWarrantyClaims,
  loadWarrantyOptions,
} from "@/lib/helpers/warranties";
import { ClaimThumb, claimContactName, claimMetaLines, claimThumbSrc } from "./ClaimThumb";
import { FastLink } from "./FastLink";
import { EmptyState, ListSkeleton } from "./ui/ListState";
import { StatusBadge } from "./ui/StatusBadge";

function Info({ label, value }: { label: string; value?: string }) {
  const text = (value || "").trim();
  if (!text) return null;
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{text}</p>
    </div>
  );
}

export function WarrantyVendorProfile({ vendorId }: { vendorId: string }) {
  const [vendor, setVendor] = useState<WarrantyVendor | null>(null);
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadWarrantyOptions({ subcontractorId: vendorId }),
      loadAllWarrantyClaims("open"),
      loadAllWarrantyClaims("closed"),
    ])
      .then(([options, open, closed]) => {
        if (cancelled) return;
        const fromApi = options?.vendor;
        const fallback = (options?.subcontractors || []).find(
          (row) => String(row.id) === vendorId
        );
        setVendor(
          fromApi ||
            (fallback
              ? { id: fallback.id, label: fallback.label, company: fallback.label }
              : { id: vendorId, label: "Vendor" })
        );
        const seen = new Set<number>();
        setItems(
          [...open, ...closed].filter((item) => {
            if (String(item.warranty_sources_subcontractors || "") !== vendorId) {
              return false;
            }
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
  }, [vendorId]);

  const trades = useMemo(() => {
    const rows = vendor?.trades || [];
    return rows.map((row) => row.label).filter(Boolean).join(", ");
  }, [vendor]);

  if (loading) return <ListSkeleton rows={4} height={78} />;
  if (!vendor) return <EmptyState>Vendor not found.</EmptyState>;

  const name = vendor.company || vendor.label;

  return (
    <div className="space-y-4">
      <section className="ceo-vendor-profile">
        <span className="ceo-vendor-mark" aria-hidden>
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="ceo-vendor-profile__name">{name}</p>
          <p className="text-sm text-[var(--muted)]">
            {vendorClaimCountLabel(items)}
          </p>
        </div>
      </section>

      <div className="ceo-warranty-detail">
        <Info label="Company" value={name} />
        <Info label="Contact" value={vendor.contact_name} />
        <Info label="Email" value={vendor.email} />
        <Info label="Phone" value={vendor.phone} />
        <Info label="Address" value={vendor.address} />
        <Info label="Trades" value={trades} />
      </div>

      <div>
        <p className="ceo-section-label mb-2">Assigned claims</p>
        {items.length ? (
          <ul className="ceo-claim-list">
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
                    <div className="ceo-claim-card__chips">
                      {item.status_label ? (
                        <StatusBadge
                          label={item.status_label}
                          color={item.status_color}
                        />
                      ) : null}
                      {isWarrantyExpiring(item) ? (
                        <StatusBadge label="Expired" />
                      ) : null}
                    </div>
                  </FastLink>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState subtitle="Claims assigned to this vendor will show here.">
            No assigned claims
          </EmptyState>
        )}
      </div>
    </div>
  );
}
