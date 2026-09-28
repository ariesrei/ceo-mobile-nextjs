"use client";

import { useEffect, useState } from "react";
import {
  historyWhen,
  listHistoryTabs,
  type HistoryTab,
  type HistoryTabId,
} from "@/lib/helpers/history";
import { EmptyState, ListSkeleton } from "./ui/ListState";

const EMPTY: Record<HistoryTabId, string> = {
  reservations: "Past reservations will show up here.",
  parcels: "Claimed parcels will show up here.",
  guests: "Past guests will show up here.",
  activity: "Logged activity will show up here.",
  warranty: "Warranty requests will show up here.",
  maintenance: "Maintenance requests will show up here.",
};

const TAB_IDS: HistoryTabId[] = [
  "reservations",
  "parcels",
  "guests",
  "activity",
  "warranty",
  "maintenance",
];

export function HistoryBoard({ initialTab }: { initialTab?: string } = {}) {
  const requested = TAB_IDS.includes(initialTab as HistoryTabId)
    ? (initialTab as HistoryTabId)
    : undefined;
  const [tabs, setTabs] = useState<HistoryTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<HistoryTabId>(requested || "reservations");

  const visible = tabs.filter((item) => item.enabled);
  const active = visible.find((item) => item.id === tab) || visible[0] || null;

  useEffect(() => {
    listHistoryTabs()
      .then((data) => {
        setTabs(data.tabs);
        const preferred = data.tabs.find(
          (item) => item.enabled && item.id === requested
        );
        const first = preferred || data.tabs.find((item) => item.enabled);
        if (first) setTab(first.id);
      })
      .finally(() => setLoading(false));
  }, [requested]);

  if (loading) return <ListSkeleton rows={4} height={72} />;

  if (!visible.length) {
    return (
      <EmptyState icon="inbox" subtitle="Nothing is turned on for this property.">
        No history to show
      </EmptyState>
    );
  }

  const items = active?.items || [];

  return (
    <div className="ceo-hist">
      <div className="ceo-hist-tabs" role="tablist" aria-label="Account history">
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active?.id === item.id}
            className={active?.id === item.id ? "is-active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label.replace(/ History$/, "")}
          </button>
        ))}
      </div>

      {!items.length ? (
        <EmptyState
          icon="inbox"
          subtitle={active ? EMPTY[active.id] : "Nothing to show."}
        >
          {`No ${active?.label.replace(/ History$/, "").toLowerCase() || "history"} yet`}
        </EmptyState>
      ) : (
        <ul className="ceo-hist-list">
          {items.map((item, index) => (
            <li key={`${item.id}-${index}`} className="ceo-hist-row">
              <span className="ceo-hist-row__body">
                <b>{item.title}</b>
                {item.subtitle ? <em>{item.subtitle}</em> : null}
                {item.status ? <em>{item.status}</em> : null}
                {item.date ? <small>{historyWhen(item.date)}</small> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
