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
  mapWarrantyVendor,
} from "@/lib/helpers/warranties";
import { getProfile } from "@/lib/helpers/profile";
import { ClaimThumb, claimContactName, claimMetaLines, claimThumbSrc } from "./ClaimThumb";
import { FastLink } from "./FastLink";
import { WarrantyVendorForm } from "./WarrantyVendorForm";
import { EmptyState, ListSkeleton } from "./ui/ListState";
import { StatusBadge } from "./ui/StatusBadge";

type Tab = "company" | "edit" | "trade" | "staff" | "open";

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
  const [canEdit, setCanEdit] = useState(false);
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadWarrantyOptions({ subcontractorId: vendorId }),
      loadAllWarrantyClaims("open"),
      loadAllWarrantyClaims("closed"),
    ])
      .then(async ([options, open, closed]) => {
        if (cancelled) return;
        const fromApi = options?.vendor;
        const fallback = (options?.subcontractors || []).find(
          (row) => String(row.id) === vendorId
        );
        const isOwn = String(options?.current_user || "") === vendorId;
        let next = fromApi
          ? {
              ...fromApi,
              avatar: fromApi.avatar || fallback?.avatar || "",
            }
          : fallback
            ? {
                id: fallback.id,
                label: fallback.label,
                company: fallback.label,
                avatar: fallback.avatar,
              }
            : { id: vendorId, label: "Vendor" };
        if (isOwn) {
          const mine = await getProfile();
          if (cancelled) return;
          if (mine.ok && mine.item) {
            next =
              mapWarrantyVendor({
                ...next,
                ...mine.item,
                id: vendorId,
                label: mine.item.company || next.label,
              }) || next;
          }
        }
        setCanEdit(isOwn && Boolean(options?.can_edit));
        setVendor(next);
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
  const tabs: { id: Tab; label: string }[] = [
    { id: "company", label: "Company" },
    ...(canEdit ? [{ id: "edit" as const, label: "Edit Company" }] : []),
    { id: "trade", label: "Trades" },
    { id: "staff", label: "Staff" },
    { id: "open", label: "Open Items" },
  ];

  return (
    <div className="space-y-4">
      <section className="ceo-vendor-profile">
        <span className="ceo-vendor-mark" aria-hidden>
          {vendor.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.avatar} alt="" />
          ) : (
            name.slice(0, 1).toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <p className="ceo-vendor-profile__name">{name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5">
            <StatusBadge label="Active" />
            <StatusBadge label={vendor.contact_type || "Sub-Contractor"} />
          </p>
        </div>
      </section>

      <div className="ceo-claim-tabs">
        {tabs.map((item) => (
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
            <p className="ceo-section-label">Company Information</p>
            <Info label="Company" value={name} />
            <Info label="Company Address" value={vendor.address} />
            <Info label="Company Phone" value={vendor.company_phone || vendor.phone} />
            <Info label="COI Expiration" value={vendor.coi_expiration} />
            <Info label="Payment Terms" value={vendor.payment_terms} />
          </section>
          <section className="ceo-warranty-detail">
            <p className="ceo-section-label">Contact Information</p>
            <Info label="Salutation / Dear" value={vendor.salutation} />
            <Info label="First Name" value={vendor.first_name} />
            <Info label="Last Name" value={vendor.last_name} />
            <Info label="Email Address" value={vendor.email} />
            <Info label="Contact Type" value={vendor.contact_type || "Sub-Contractor"} />
            <Info label="Phone Number" value={vendor.phone} />
            <Info label="Mobile Number" value={vendor.mobile} />
            <Info label="Job Title" value={vendor.job_title} />
            <Info label="Rating" value={vendor.rating} />
          </section>
          <section className="ceo-warranty-detail">
            <p className="ceo-section-label">Notifications</p>
            <Info label="Email Notification Enable" value={onOff(vendor.opt_email)} />
            <Info label="SMS Notification Enable" value={onOff(vendor.opt_sms)} />
          </section>
        </div>
      ) : null}

      {tab === "edit" && canEdit ? (
        <WarrantyVendorForm
          vendor={vendor}
          onSaved={(next) => setVendor((prev) => ({ ...prev, ...next }))}
        />
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
        <div className="space-y-3">
          <div className="ceo-vendor-open-counts">
            <span>
              <strong>{openItems.length}</strong> Warranties
            </span>
            <span>
              <strong>0</strong> Maintenance
            </span>
            <span>
              <strong>{openItems.length}</strong> Total
            </span>
          </div>
        {openItems.length ? (
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
        )}
        </div>
      ) : null}
    </div>
  );
}
