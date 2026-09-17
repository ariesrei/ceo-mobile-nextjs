"use client";

import { useEffect, useState } from "react";
import type { WarrantyItem } from "@/lib/warranties";
import { isWarrantyClosed, isWarrantyInProgress } from "@/lib/warranties";
import {
  countBy,
  expiringItems,
  fetchAllWarrantyItems,
} from "@/lib/warranty-reports";
import { FastLink } from "./FastLink";
import {
  BuildingIcon,
  ChartIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  DownloadIcon,
  FolderOpenIcon,
  UsersIcon,
} from "./ui/Icons";

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsv(items: WarrantyItem[]) {
  const header = [
    "ID",
    "Unit",
    "Resident",
    "Request",
    "Status",
    "Assigned",
    "Created",
  ];
  const rows = items.map((w) => [
    String(w.id),
    w.unit_title || "",
    [w.warranty_first_name, w.warranty_last_name].filter(Boolean).join(" ") ||
      w.resident_name ||
      "",
    w.warranty_describe_the_request ||
      w.warranty_describe_the_request_single ||
      "",
    w.status_label || "",
    w.subcontractor_name || "",
    w.created_date || "",
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function WarrantyReports() {
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAllWarrantyItems()
      .then((next) => {
        if (!cancelled) setItems(next);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Could not load reports.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function downloadCsv() {
    setExporting(true);
    try {
      const blob = new Blob([toCsv(items)], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "warranty-claims.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const open = items.filter((w) => !isWarrantyClosed(w) && !isWarrantyInProgress(w));
  const progress = items.filter((w) => isWarrantyInProgress(w));
  const closed = items.filter((w) => isWarrantyClosed(w));
  const expiring = expiringItems(items);
  const byUnit = countBy(items, (w) => w.unit_title || "").slice(0, 6);
  const byVendor = countBy(
    items,
    (w) => w.subcontractor_name || ""
  ).slice(0, 6);

  if (loading) {
    return (
      <div className="ceo-warranty-home-skel" role="status" aria-label="Loading reports">
        <div className="ceo-skel h-[124px] rounded-[1.25rem]" />
        <div className="ceo-skel h-[58px] rounded-2xl" />
        <div className="ceo-skel h-[58px] rounded-2xl" />
        <div className="ceo-skel h-[58px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <section className="ceo-warranty-overview">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Claims Summary</p>
          <span className="ceo-warranty-overview__period">
            {items.length} total
          </span>
        </div>
        <div className="ceo-warranty-stats">
          <FastLink
            href="/account/warranties/claims?tab=open"
            className="ceo-warranty-stat"
          >
            <span className="ceo-warranty-stat__n">{open.length}</span>
            <span className="ceo-warranty-stat__l">Open</span>
          </FastLink>
          <FastLink
            href="/account/warranties/claims?tab=progress"
            className="ceo-warranty-stat"
          >
            <span className="ceo-warranty-stat__n">{progress.length}</span>
            <span className="ceo-warranty-stat__l">In Progress</span>
          </FastLink>
          <FastLink
            href="/account/warranties/claims?tab=closed"
            className="ceo-warranty-stat"
          >
            <span className="ceo-warranty-stat__n">{closed.length}</span>
            <span className="ceo-warranty-stat__l">Closed</span>
          </FastLink>
        </div>
      </section>

      <nav className="ceo-warranty-menu ceo-warranty-menu--pills">
        <FastLink
          href="/account/warranties/claims?tab=expiring"
          className="ceo-warranty-menu__row"
        >
          <span className="ceo-warranty-menu__icon">
            <ClockIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="ceo-warranty-menu__label">Warranty Expirations</span>
          <span className="ceo-warranty-menu__meta">{expiring.length}</span>
          <ChevronRightIcon className="ceo-warranty-menu__chev" />
        </FastLink>
        <FastLink href="/account/warranties/claims?tab=open" className="ceo-warranty-menu__row">
          <span className="ceo-warranty-menu__icon">
            <FolderOpenIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="ceo-warranty-menu__label">Open Claims</span>
          <span className="ceo-warranty-menu__meta">{open.length}</span>
          <ChevronRightIcon className="ceo-warranty-menu__chev" />
        </FastLink>
        <FastLink href="/account/warranties/claims?tab=closed" className="ceo-warranty-menu__row">
          <span className="ceo-warranty-menu__icon">
            <CheckCircleIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="ceo-warranty-menu__label">Closed Claims</span>
          <span className="ceo-warranty-menu__meta">{closed.length}</span>
          <ChevronRightIcon className="ceo-warranty-menu__chev" />
        </FastLink>
        <button
          type="button"
          className="ceo-warranty-menu__row w-full text-left"
          disabled={exporting || !items.length}
          onClick={downloadCsv}
        >
          <span className="ceo-warranty-menu__icon">
            <DownloadIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="ceo-warranty-menu__label">
            {exporting ? "Exporting…" : "Export Data"}
          </span>
          <ChevronRightIcon className="ceo-warranty-menu__chev" />
        </button>
      </nav>

      <section className="space-y-2">
        <p className="ceo-section-label">Claims by Unit</p>
        <div className="ceo-warranty-menu ceo-warranty-menu--pills">
          {byUnit.length ? (
            byUnit.map((row) => (
              <FastLink
                key={row.label}
                href="/account/warranties/claims"
                className="ceo-warranty-menu__row"
              >
                <span className="ceo-warranty-menu__icon">
                  <BuildingIcon className="h-[18px] w-[18px]" />
                </span>
                <span className="ceo-warranty-menu__label">{row.label}</span>
                <span className="ceo-warranty-menu__meta">{row.count}</span>
              </FastLink>
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-[var(--muted)]">No claims yet.</p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <p className="ceo-section-label">Claims by Subcontractor</p>
        <div className="ceo-warranty-menu ceo-warranty-menu--pills">
          {byVendor.length ? (
            byVendor.map((row) => (
              <FastLink
                key={row.label}
                href="/account/warranties/vendors"
                className="ceo-warranty-menu__row"
              >
                <span className="ceo-warranty-menu__icon">
                  {row.label === "Unassigned" ? (
                    <ChartIcon className="h-[18px] w-[18px]" />
                  ) : (
                    <UsersIcon className="h-[18px] w-[18px]" />
                  )}
                </span>
                <span className="ceo-warranty-menu__label">{row.label}</span>
                <span className="ceo-warranty-menu__meta">{row.count}</span>
              </FastLink>
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-[var(--muted)]">No claims yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
