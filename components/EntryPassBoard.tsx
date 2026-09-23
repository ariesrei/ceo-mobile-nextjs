"use client";

import { useEffect, useState } from "react";
import {
  listUnitEntries,
  type UnitEntryItem,
  type UnitEntryType,
} from "@/lib/helpers/unit-entries";
import { FastLink } from "./FastLink";
import { ListGo, ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

type Tab = "guests" | "deliveries" | "history";

function parseWhen(value: string): Date | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  const us = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(am|pm)?)?/i
  );
  if (us) {
    let hour = us[4] ? Number(us[4]) : 0;
    const minute = us[5] ? Number(us[5]) : 0;
    const ap = (us[6] || "").toLowerCase();
    if (ap === "pm" && hour < 12) hour += 12;
    if (ap === "am" && hour === 12) hour = 0;
    const next = new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]), hour, minute);
    return Number.isNaN(next.getTime()) ? null : next;
  }
  const parsed = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatPassWhen(start: string, end?: string): string {
  const from = parseWhen(start);
  const to = parseWhen(end || "");
  if (!from) return [start, end].filter(Boolean).join(" · ");
  const day = from.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const t1 = from.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (!to) return `${day} • ${t1}`;
  const t2 = to.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} • ${t1} - ${t2}`;
}

function Mark({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="ceo-pass-card__photo" />
    );
  }
  return (
    <span className="ceo-pass-card__photo ceo-pass-card__mark" aria-hidden>
      {(name[0] || "G").toUpperCase()}
    </span>
  );
}

function PassCard({ item }: { item: UnitEntryItem }) {
  const name = item.name || item.type_label || "Guest";
  return (
    <div className="ceo-pass-card">
      <Mark name={name} src={item.photo} />
      <span>
        <b>{name}</b>
        <em>{item.type_label || item.type}</em>
        <small>{formatPassWhen(item.entry_date, item.expire_date)}</small>
      </span>
      <ListGo icon={item.type === "Delivery" ? "inbox" : "pass"} />
    </div>
  );
}

export function EntryPassBoard() {
  const [tab, setTab] = useState<Tab>("guests");
  const [items, setItems] = useState<UnitEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const type: UnitEntryType | "all" =
      tab === "guests" ? "Guest" : tab === "deliveries" ? "Delivery" : "all";
    const status = tab === "history" ? "history" : "active";
    listUnitEntries({ type, status })
      .then((res) => {
        if (!cancelled) setItems(res.ok ? res.items : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const createHref =
    tab === "deliveries" ? "/account/entry-pass/delivery" : "/account/entry-pass/new";

  return (
    <div className="ceo-pass">
      <div className="ceo-assets-tabs" role="tablist" aria-label="Entry pass type">
        {(
          [
            { id: "guests", label: "Guests" },
            { id: "deliveries", label: "Deliveries" },
            { id: "history", label: "History" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "is-active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab !== "history" ? (
        <FastLink href={createHref} className="ceo-pass-create">
          <span className="ceo-pass-create__plus" aria-hidden>
            +
          </span>
          <b>Create a New Pass</b>
          <p>Grant access to guests, service providers or deliveries.</p>
        </FastLink>
      ) : null}

      <h2 className="ceo-pass-heading">
        {tab === "history" ? "History" : "Active Passes"}
      </h2>

      {pending ? (
        <ListSkeleton rows={2} height={84} />
      ) : (
        <PaginatedList
          items={items}
          listClassName="ceo-pass-list"
          emptyIcon={tab === "deliveries" ? "inbox" : "pass"}
          emptyMessage={
            tab === "history"
              ? "No past passes yet"
              : tab === "deliveries"
                ? "No active deliveries"
                : "No active guest passes"
          }
          emptySubtitle={
            tab === "history"
              ? "Expired guest and delivery authorizations land here."
              : tab === "deliveries"
                ? "Food delivery authorizations will show up here."
                : "Create a pass to let a guest in."
          }
          getKey={(item) => String(item.id)}
          renderItem={(item) => <PassCard item={item} />}
        />
      )}
    </div>
  );
}
