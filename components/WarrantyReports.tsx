"use client";

import { useState } from "react";
import type { WarrantyItem, WarrantyListResponse } from "@/lib/warranties";
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

const ROWS = [
  { label: "Claims Summary", href: "/account/warranties", Icon: ChartIcon },
  {
    label: "Open Claims",
    href: "/account/warranties/claims?tab=open",
    Icon: FolderOpenIcon,
  },
  {
    label: "Closed Claims",
    href: "/account/warranties/claims?tab=closed",
    Icon: CheckCircleIcon,
  },
  {
    label: "Claims by Subcontractor",
    href: "/account/warranties/vendors",
    Icon: UsersIcon,
  },
  {
    label: "Claims by Unit",
    href: "/account/warranties/claims",
    Icon: BuildingIcon,
  },
  {
    label: "Warranty Expirations",
    href: "/account/warranties/claims?tab=expiring",
    Icon: ClockIcon,
  },
];

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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  async function exportData() {
    setExporting(true);
    setExportError("");
    try {
      const [openRes, closedRes] = await Promise.all([
        fetch("/api/wp/warranties?status=open&per_page=50"),
        fetch("/api/wp/warranties?status=closed&per_page=50"),
      ]);
      const open = (await openRes.json()) as WarrantyListResponse & {
        message?: string;
      };
      const closed = (await closedRes.json()) as WarrantyListResponse & {
        message?: string;
      };
      if (!openRes.ok) throw new Error(open.message || "Could not export open claims.");
      if (!closedRes.ok) {
        throw new Error(closed.message || "Could not export closed claims.");
      }
      const seen = new Set<number>();
      const items = [...(open.items || []), ...(closed.items || [])].filter(
        (w) => {
          if (seen.has(w.id)) return false;
          seen.add(w.id);
          return true;
        }
      );
      const blob = new Blob([toCsv(items)], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "warranty-claims.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <nav className="ceo-warranty-menu ceo-warranty-menu--pills">
        {ROWS.map(({ label, href, Icon }) => (
          <FastLink key={label} href={href} className="ceo-warranty-menu__row">
            <span className="ceo-warranty-menu__icon">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="ceo-warranty-menu__label">{label}</span>
            <ChevronRightIcon className="ceo-warranty-menu__chev" />
          </FastLink>
        ))}
        <button
          type="button"
          className="ceo-warranty-menu__row w-full text-left"
          disabled={exporting}
          onClick={exportData}
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
      {exportError ? (
        <p className="text-sm text-[var(--danger)]">{exportError}</p>
      ) : null}
    </div>
  );
}
