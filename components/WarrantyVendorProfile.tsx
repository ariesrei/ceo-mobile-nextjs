"use client";

import { useEffect, useMemo, useState } from "react";
import type { WarrantyItem, WarrantyVendor } from "@/lib/warranties";
import {
  isWarrantyClosed,
  isWarrantyExpiring,
} from "@/lib/warranties";
import {
  loadAllWarrantyClaims,
  loadWarrantyOptions,
} from "@/lib/helpers/warranties";
import { ClaimThumb, claimContactName, claimMetaLines, claimThumbSrc } from "./ClaimThumb";
import { FastLink } from "./FastLink";
import { EmptyState, ListSkeleton } from "./ui/ListState";
import { StatusBadge } from "./ui/StatusBadge";

type Tab = "company" | "trade" | "staff" | "open";

const TABS: { id: Tab; label: string }[] = [
  { id: "company", label: "Company" },
  { id: "trade", label: "Trade" },
  { id: "staff", label: "Staff" },
  { id: "open", label: "Open Items" },
];

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

function onOff(on?: boolean) {
  return on ? "On" : "Off";
}

export function WarrantyVendorProfile({ vendorId }: { vendorId: string }) {
  const [tab, setTab] = useState<Tab>("company");
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

  const trades = vendor?.trades || [];
  const staff = vendor?.staff || [];
  const openItems = useMemo(
    () => items.filter((item) => !isWarrantyClosed(item)),
    [items]
  );

  if (loading) return <ListSkeleton rows={4} height={78} />;
  if (!vendor) return <EmptyState>Vendor not found.</EmptyState>;

  const name = vendor.company || vendor.label;

  return (
    <div className="space-y-4">
      <section className="ceo-vendor-profile">
        {vendor.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vendor.avatar} alt="" className="ceo-vendor-avatar" />
        ) : (
          <span className="ceo-vendor-mark" aria-hidden>
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="ceo-vendor-profile__name">{name}</p>
          <p className="text-sm text-[var(--muted)]">
            {vendor.contact_type || "Sub-Contractor"}
          </p>
        </div>
      </section>

      <div className="ceo-claim-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`ceo-claim-tab${tab === item.id ? " is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "company" ? (
        <div className="space-y-4">
          <section className="ceo-warranty-detail">
            <p className="ceo-section-label">Company information</p>
            <Info label="Company" value={name} />
            <Info label="Company address" value={vendor.address} />
            <Info label="Company phone" value={vendor.company_phone || vendor.phone} />
            <Info label="COI expiration" value={vendor.coi_expiration} />
          </section>
          <section className="ceo-warranty-detail">
            <p className="ceo-section-label">Contact information</p>
            <Info label="Salutation" value={vendor.salutation} />
            <Info label="First name" value={vendor.first_name} />
            <Info label="Last name" value={vendor.last_name} />
            <Info label="Contact type" value={vendor.contact_type || "Sub-Contractor"} />
            <Info label="Email" value={vendor.email} />
            <Info label="Phone number" value={vendor.phone} />
            <Info label="Mobile number" value={vendor.mobile} />
            <Info label="Job title" value={vendor.job_title} />
            <Info label="Rating" value={vendor.rating} />
          </section>
          <section className="ceo-warranty-detail">
            <p className="ceo-section-label">Notifications</p>
            <Info label="Email notification" value={onOff(vendor.opt_email)} />
            <Info label="SMS notification" value={onOff(vendor.opt_sms)} />
          </section>
        </div>
      ) : null}

      {tab === "trade" ? (
        trades.length ? (
          <ul className="ceo-vendor-chips">
            {trades.map((trade) => (
              <li key={String(trade.id)}>{trade.label}</li>
            ))}
          </ul>
        ) : (
          <EmptyState subtitle="Trades for this company will show here.">
            No trades
          </EmptyState>
        )
      ) : null}

      {tab === "staff" ? (
        staff.length ? (
          <ul className="ceo-claim-list">
            {staff.map((person, index) => (
              <li key={`${person.email || person.name}-${index}`}>
                <div className="ceo-claim-card">
                  <span className="ceo-vendor-mark" aria-hidden>
                    {(person.name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="ceo-claim-card__title">
                      {person.name || "Staff"}
                    </p>
                    <div className="ceo-claim-card__meta">
                      {person.job_title ? <span>{person.job_title}</span> : null}
                      {person.email ? <span>{person.email}</span> : null}
                      {person.phone ? <span>{person.phone}</span> : null}
                    </div>
                  </div>
                  {person.active ? <StatusBadge label="Active" /> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState subtitle="Staff for this company will show here.">
            No staff
          </EmptyState>
        )
      ) : null}

      {tab === "open" ? (
        openItems.length ? (
          <ul className="ceo-claim-list">
            {openItems.map((item) => {
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
          <EmptyState subtitle="Open claims assigned to this vendor will show here.">
            No open items
          </EmptyState>
        )
      ) : null}
    </div>
  );
}
