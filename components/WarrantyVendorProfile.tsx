"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  WarrantyItem,
  WarrantyVendor,
  WarrantyVendorOpenItem,
  WarrantyVendorStaff,
  WarrantyVendorTrade,
} from "@/lib/warranties";
import { isWarrantyClosed, isWarrantyExpiring } from "@/lib/warranties";
import {
  loadAllWarrantyClaims,
  loadWarrantyOptions,
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

function staffKey(person: WarrantyVendorStaff) {
  return (person.email || person.name || "").trim().toLowerCase();
}

function StaffCard({ person }: { person: WarrantyVendorStaff }) {
  return (
    <div className="ceo-claim-card">
      <span className="ceo-vendor-mark" aria-hidden>
        {(person.name || "?").slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="ceo-claim-card__title">{person.name || "Staff"}</p>
        <div className="ceo-claim-card__meta">
          {person.job_title ? <span>{person.job_title}</span> : null}
          {person.email ? <span>{person.email}</span> : null}
          {person.phone ? <span>{person.phone}</span> : null}
        </div>
      </div>
      <div className="ceo-claim-card__chips">
        {person.active ? <StatusBadge label="Active" /> : null}
        {person.notify ? <StatusBadge label="Notify" /> : null}
      </div>
    </div>
  );
}

export function WarrantyVendorProfile({ vendorId }: { vendorId: string }) {
  const [tab, setTab] = useState<Tab>("company");
  const [vendor, setVendor] = useState<WarrantyVendor | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [openRows, setOpenRows] = useState<WarrantyVendorOpenItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadWarrantyOptions({ subcontractorId: vendorId }),
      getProfile(vendorId),
      loadAllWarrantyClaims("open"),
      loadAllWarrantyClaims("closed"),
    ])
      .then(([options, mine, open, closed]) => {
        if (cancelled) return;
        const fromApi = options?.vendor;
        const fallback = (options?.subcontractors || []).find(
          (row) => String(row.id) === vendorId
        );
        const profile =
          mine.ok && String(mine.item.id) === String(vendorId)
            ? mine.item
            : null;
        const trades: WarrantyVendorTrade[] = fromApi?.trades?.length
          ? fromApi.trades
          : (options?.trades || []).map((trade) => ({
              id: trade.id,
              label: trade.label,
              staff: [],
            }));
        const staff: WarrantyVendorStaff[] = fromApi?.staff?.length
          ? fromApi.staff
          : trades.flatMap((trade) => trade.staff || []);
        const next: WarrantyVendor = {
          id: vendorId,
          label:
            fromApi?.label ||
            profile?.company ||
            fallback?.label ||
            "Vendor",
          company:
            fromApi?.company || profile?.company || fallback?.label || "",
          address: fromApi?.address || profile?.address || "",
          company_phone:
            fromApi?.company_phone || profile?.company_phone || "",
          phone: fromApi?.phone || profile?.phone || "",
          mobile: fromApi?.mobile || profile?.mobile || "",
          email: fromApi?.email || profile?.email || profile?.ceo_email || "",
          first_name: fromApi?.first_name || profile?.first_name || "",
          last_name: fromApi?.last_name || profile?.last_name || "",
          salutation: fromApi?.salutation || profile?.salutation || "",
          job_title: fromApi?.job_title || profile?.job_title || "",
          rating: fromApi?.rating || "",
          contact_type:
            fromApi?.contact_type ||
            profile?.contact_type ||
            "Sub-Contractor",
          coi_expiration:
            fromApi?.coi_expiration || profile?.coi_expiration || "",
          payment_terms:
            fromApi?.payment_terms || profile?.payment_terms || "",
          opt_email: fromApi?.opt_email ?? profile?.opt_email,
          opt_sms: fromApi?.opt_sms ?? profile?.opt_sms,
          avatar:
            fromApi?.avatar || profile?.avatar || fallback?.avatar || "",
          trades,
          staff,
          open_items: fromApi?.open_items || options?.open_items || [],
        };
        const canTarget = Boolean(
          (fromApi && String(fromApi.id) === vendorId) || profile
        );
        setCanEdit(
          Boolean(options?.is_staff && options?.can_edit && canTarget)
        );
        setVendor(next);
        setOpenRows(next.open_items || []);
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
  const staff = useMemo(() => {
    const rows = vendor?.staff || [];
    if (rows.length) return rows;
    const seen = new Set<string>();
    const next: WarrantyVendorStaff[] = [];
    for (const trade of trades) {
      for (const person of trade.staff || []) {
        const key = staffKey(person);
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        next.push(person);
      }
    }
    return next;
  }, [vendor?.staff, trades]);

  const fallbackOpen = useMemo(
    () => items.filter((item) => !isWarrantyClosed(item)),
    [items]
  );
  const apiOpen = openRows;
  const warrantyOpen = apiOpen.filter((row) => row.type !== "maintenance");
  const maintenanceOpen = apiOpen.filter((row) => row.type === "maintenance");
  const warrantyCount = apiOpen.length
    ? warrantyOpen.length
    : fallbackOpen.length;
  const maintenanceCount = maintenanceOpen.length;
  const totalOpen = warrantyCount + maintenanceCount;

  if (loading) return <ListSkeleton rows={4} height={78} />;
  if (!vendor) return <EmptyState>Vendor not found.</EmptyState>;

  const name = vendor.company || vendor.label;
  const tabs: { id: Tab; label: string }[] = [
    { id: "company", label: "Company" },
    ...(canEdit ? [{ id: "edit" as const, label: "Edit Company" }] : []),
    { id: "trade", label: "Trade" },
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
          <p className="text-sm text-[var(--muted)]">
            {vendor.contact_type || "Sub-Contractor"}
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
            <p className="ceo-section-label">Company information</p>
            <Info label="Company" value={name} />
            <Info label="Company address" value={vendor.address} />
            <Info
              label="Company phone"
              value={vendor.company_phone || vendor.phone}
            />
            <Info label="COI expiration" value={vendor.coi_expiration} />
            <Info label="Payment terms" value={vendor.payment_terms} />
          </section>
          <section className="ceo-warranty-detail">
            <p className="ceo-section-label">Contact information</p>
            <Info label="Salutation" value={vendor.salutation} />
            <Info label="First name" value={vendor.first_name} />
            <Info label="Last name" value={vendor.last_name} />
            <Info
              label="Contact type"
              value={vendor.contact_type || "Sub-Contractor"}
            />
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

      {tab === "edit" && canEdit ? (
        <WarrantyVendorForm
          vendor={vendor}
          onSaved={(next) =>
            setVendor((prev) => (prev ? { ...prev, ...next } : next))
          }
        />
      ) : null}

      {tab === "trade" ? (
        trades.length ? (
          <div className="space-y-3">
            {trades.map((trade) => (
              <section
                key={String(trade.id)}
                className="ceo-warranty-detail ceo-vendor-trade"
              >
                <p className="ceo-section-label">{trade.label}</p>
                <Info label="Coverage area" value={trade.coverage} />
                <Info label="Priority rank" value={trade.priority} />
                <Info label="SLA hours" value={trade.sla} />
                {(trade.staff || []).length ? (
                  <ul className="ceo-claim-list ceo-vendor-trade__staff">
                    {trade.staff!.map((person, index) => (
                      <li key={`${staffKey(person) || index}`}>
                        <StaffCard person={person} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
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
              <li key={`${staffKey(person) || index}`}>
                <StaffCard person={person} />
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
              <strong>{warrantyCount}</strong> Warranties
            </span>
            <span>
              <strong>{maintenanceCount}</strong> Maintenance
            </span>
            <span>
              <strong>{totalOpen}</strong> Total
            </span>
          </div>
          {apiOpen.length ? (
            <ul className="ceo-claim-list">
              {apiOpen.map((row) => {
                const card = (
                  <div className="ceo-claim-card">
                    <div className="min-w-0 flex-1">
                      <p className="ceo-claim-card__id">
                        {row.type_label || row.type} #{row.id}
                      </p>
                      <p className="ceo-claim-card__title">
                        {row.description || "Open item"}
                      </p>
                      <div className="ceo-claim-card__meta">
                        {row.unit ? <span>{row.unit}</span> : null}
                        {row.resident ? <span>{row.resident}</span> : null}
                        {row.date ? <span>{row.date}</span> : null}
                        {row.due ? <span>Due {row.due}</span> : null}
                      </div>
                    </div>
                    {row.status ? <StatusBadge label={row.status} /> : null}
                  </div>
                );
                return (
                  <li key={`${row.type}-${row.id}`}>
                    {row.type === "warranty" ? (
                      <FastLink
                        href={`/account/warranties/${row.id}`}
                        className="block"
                      >
                        {card}
                      </FastLink>
                    ) : (
                      card
                    )}
                  </li>
                );
              })}
            </ul>
          ) : fallbackOpen.length ? (
            <ul className="ceo-claim-list">
              {fallbackOpen.map((item) => {
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
