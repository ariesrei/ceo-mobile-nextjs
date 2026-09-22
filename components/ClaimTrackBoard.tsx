"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WarrantyItem } from "@/lib/warranties";
import { isWarrantyClosed } from "@/lib/warranties";
import { loadWarrantyClaims } from "@/lib/helpers/warranties";
import { FastLink } from "./FastLink";
import { EmptyState, ListSkeleton } from "./ui/ListState";
import { ChevronRightIcon, RefreshIcon } from "./ui/Icons";
import { useHeldLoading } from "./ui/useLoadMore";

function claimCode(id: number): string {
  return `#CLM-${String(id).padStart(5, "0")}`;
}

function claimTitle(item: WarrantyItem): string {
  return (
    item.type_label ||
    item.warranty_describe_the_request ||
    item.warranty_describe_the_request_single ||
    item.title ||
    "Warranty claim"
  );
}

function submittedWhen(date: string): string {
  const raw = (date || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function loadClaims(status: "open" | "closed"): Promise<WarrantyItem[]> {
  const data = await loadWarrantyClaims(status, { perPage: 20 });
  return data.items;
}

export function ClaimTrackBoard() {
  const [openItems, setOpenItems] = useState<WarrantyItem[]>([]);
  const [closedItems, setClosedItems] = useState<WarrantyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([loadClaims("open"), loadClaims("closed")])
      .then(([open, closed]) => {
        setOpenItems(open);
        setClosedItems(closed);
      })
      .catch(() => {
        setOpenItems([]);
        setClosedItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = useMemo(
    () => openItems.filter((item) => !isWarrantyClosed(item)),
    [openItems]
  );
  const past = useMemo(
    () => [
      ...closedItems,
      ...openItems.filter((item) => isWarrantyClosed(item)),
    ],
    [closedItems, openItems]
  );
  const featured = active[0] || null;
  const submitted = featured ? submittedWhen(featured.created_date) : "";

  if (pending) return <ListSkeleton rows={3} height={120} />;

  return (
    <div className="ceo-claimtrack">
      <section className="ceo-claimtrack-card">
        <div className="ceo-claimtrack-card__head">
          <h2>Active Claims</h2>
          <button
            type="button"
            className="ceo-claimtrack-card__icon"
            aria-label="Refresh claims"
            onClick={() => load(true)}
          >
            <RefreshIcon />
          </button>
        </div>
        <p className="ceo-claimtrack-card__count">{active.length}</p>
        <FastLink
          href={
            featured
              ? `/account/warranties/${featured.id}`
              : "/account/warranties/claims?tab=open"
          }
          className="ceo-claimtrack-card__link"
        >
          View Details
        </FastLink>
        {featured ? (
          <FastLink
            href={`/account/warranties/${featured.id}`}
            className="ceo-claimtrack-preview"
          >
            <b>{claimCode(featured.id)}</b>
            <em>{claimTitle(featured)}</em>
            {submitted ? <small>Submitted: {submitted}</small> : null}
            <small>
              Status: {featured.status_label || "In Progress"}
            </small>
          </FastLink>
        ) : (
          <EmptyState
            icon="inbox"
            compact
            subtitle="Open claims will show up here."
          >
            No active claims
          </EmptyState>
        )}
      </section>

      <section className="ceo-claimtrack-card">
        <div className="ceo-claimtrack-card__head">
          <h2>Past Claims</h2>
          <FastLink
            href="/account/warranties/claims?tab=closed"
            className="ceo-claimtrack-card__icon"
            aria-label="View all past claims"
          >
            <ChevronRightIcon />
          </FastLink>
        </div>
        <p className="ceo-claimtrack-card__count">{past.length}</p>
        <FastLink
          href="/account/warranties/claims?tab=closed"
          className="ceo-claimtrack-card__link"
        >
          View All
        </FastLink>
      </section>
    </div>
  );
}
