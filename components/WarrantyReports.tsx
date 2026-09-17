"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { WarrantyItem } from "@/lib/warranties";
import { fetchAllWarrantyItems } from "@/lib/warranty-reports";
import { FastLink } from "./FastLink";
import {
  BuildingIcon,
  ChevronRightIcon,
  ClockIcon,
  DownloadIcon,
  FileIcon,
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

  if (loading) {
    return (
      <div className="ceo-warranty-home-skel" role="status" aria-label="Loading reports">
        <div className="ceo-skel h-[58px] rounded-2xl" />
        <div className="ceo-skel h-[58px] rounded-2xl" />
        <div className="ceo-skel h-[58px] rounded-2xl" />
        <div className="ceo-skel h-[58px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <nav className="ceo-warranty-menu ceo-warranty-menu--pills">
        <ReportLink
          href="/account/warranties"
          icon={<FileIcon className="h-[18px] w-[18px]" />}
          label="Claims Summary"
        />
        <ReportLink
          href="/account/warranties/claims?tab=open"
          icon={<FolderOpenIcon className="h-[18px] w-[18px]" />}
          label="Open Claims"
        />
        <ReportLink
          href="/account/warranties/claims?tab=closed"
          icon={<FileIcon className="h-[18px] w-[18px]" />}
          label="Closed Claims"
        />
        <ReportLink
          href="/account/warranties/vendors"
          icon={<UsersIcon className="h-[18px] w-[18px]" />}
          label="Claims by Subcontractor"
        />
        <ReportLink
          href="/account/warranties/claims"
          icon={<BuildingIcon className="h-[18px] w-[18px]" />}
          label="Claims by Unit"
        />
        <ReportLink
          href="/account/warranties/claims?tab=expiring"
          icon={<ClockIcon className="h-[18px] w-[18px]" />}
          label="Warranty Expirations"
        />
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
    </div>
  );
}

function ReportLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <FastLink href={href} className="ceo-warranty-menu__row">
      <span className="ceo-warranty-menu__icon">{icon}</span>
      <span className="ceo-warranty-menu__label">{label}</span>
      <ChevronRightIcon className="ceo-warranty-menu__chev" />
    </FastLink>
  );
}
