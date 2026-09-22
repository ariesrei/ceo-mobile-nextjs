"use client";

import { useEffect, useState } from "react";
import type { GuestItem } from "@/lib/guests";
import type { ParcelItem } from "@/lib/parcels";
import { listGuests } from "@/lib/helpers/guests";
import { listParcels } from "@/lib/helpers/parcels";
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

export function EntryPassBoard() {
  const [tab, setTab] = useState<Tab>("guests");
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [deliveries, setDeliveries] = useState<ParcelItem[]>([]);
  const [pastGuests, setPastGuests] = useState<GuestItem[]>([]);
  const [pastDeliveries, setPastDeliveries] = useState<ParcelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load =
      tab === "guests"
        ? listGuests({ status: "checked_in" }).then((res) => {
            if (!cancelled && res.ok) setGuests(res.items);
          })
        : tab === "deliveries"
          ? listParcels({ status: "storage" }).then((res) => {
              if (!cancelled && res.ok) setDeliveries(res.items);
            })
          : Promise.all([
              listGuests({ status: "checked_out" }),
              listParcels({ status: "claimed" }),
            ]).then(([guestRes, parcelRes]) => {
              if (cancelled) return;
              if (guestRes.ok) setPastGuests(guestRes.items);
              if (parcelRes.ok) setPastDeliveries(parcelRes.items);
            });
    load.finally(() => {
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
      <div className="ceo-assets-tabs" role="tablist" aria-label="Unit entry authorization type">
        {(
          [
            { id: "guests", label: "Guests" },
            { id: "deliveries", label: "Food Delivery" },
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
        <div className="ceo-pass-create">
          <FastLink href={createHref} className="ceo-pass-create__plus" aria-label="Add entry authorization">
            +
          </FastLink>
          <b>Add Entry Authorization</b>
          <p>Grant access to guests or food deliveries.</p>
        </div>
      ) : null}

      <h2 className="ceo-pass-heading">
        {tab === "history" ? "History" : "Active authorizations"}
      </h2>

      {pending ? (
        <ListSkeleton rows={2} height={84} />
      ) : tab === "guests" ? (
        <PaginatedList
          items={guests}
          listClassName="ceo-pass-list"
          emptyIcon="pass"
          emptyMessage="No active guest authorizations"
          emptySubtitle="Add an authorization to let a guest in."
          getKey={(item) => `g-${item.id}`}
          renderItem={(item) => {
            const name = item.guest_names || item.title || "Guest";
            return (
              <FastLink href={`/account/guests/${item.id}/edit`} className="ceo-pass-card">
                <Mark name={name} src={item.photos?.[0]?.url} />
                <span>
                  <b>{name}</b>
                  <em>Guest</em>
                  <small>{formatPassWhen(item.guest_check_in, item.guest_check_out)}</small>
                </span>
                <ListGo icon="pass" />
              </FastLink>
            );
          }}
        />
      ) : tab === "deliveries" ? (
        <PaginatedList
          items={deliveries}
          listClassName="ceo-pass-list"
          emptyIcon="inbox"
          emptyMessage="No active food deliveries"
          emptySubtitle="Food delivery authorizations will show up here."
          getKey={(item) => `p-${item.id}`}
          renderItem={(item) => {
            const name = item.resident_name || item.title || "Delivery";
            return (
              <FastLink href={`/account/parcels/${item.id}/edit`} className="ceo-pass-card">
                <Mark name={name} src={item.photos?.[0]?.url} />
                <span>
                  <b>{name}</b>
                  <em>{item.parcel_type_label || "Food Delivery"}</em>
                  <small>{formatPassWhen(item.parcel_delivered_on)}</small>
                </span>
                <ListGo icon="inbox" />
              </FastLink>
            );
          }}
        />
      ) : (
        <PaginatedList
          items={[
            ...pastGuests.map((item) => ({ kind: "guest" as const, item })),
            ...pastDeliveries.map((item) => ({ kind: "parcel" as const, item })),
          ]}
          listClassName="ceo-pass-list"
          emptyIcon="pass"
          emptyMessage="No past authorizations yet"
          emptySubtitle="Expired guests and food deliveries land here."
          getKey={(row) => `${row.kind}-${row.item.id}`}
          renderItem={(row) => {
            if (row.kind === "guest") {
              const item = row.item;
              const name = item.guest_names || item.title || "Guest";
              return (
                <FastLink href={`/account/guests/${item.id}/edit`} className="ceo-pass-card">
                  <Mark name={name} src={item.photos?.[0]?.url} />
                  <span>
                    <b>{name}</b>
                    <em>Guest</em>
                    <small>{formatPassWhen(item.guest_check_in, item.guest_check_out)}</small>
                  </span>
                  <ListGo icon="pass" />
                </FastLink>
              );
            }
            const item = row.item;
            const name = item.resident_name || item.title || "Delivery";
            return (
              <FastLink href={`/account/parcels/${item.id}/edit`} className="ceo-pass-card">
                <Mark name={name} src={item.photos?.[0]?.url} />
                <span>
                  <b>{name}</b>
                  <em>{item.parcel_type_label || "Food Delivery"}</em>
                  <small>{formatPassWhen(item.parcel_delivered_on)}</small>
                </span>
                <ListGo icon="inbox" />
              </FastLink>
            );
          }}
        />
      )}
    </div>
  );
}
