"use client";

import { useEffect, useState } from "react";
import {
  historyHref,
  historyStatusTone,
  historyWhen,
  listHistoryTabs,
  type HistoryTab,
  type HistoryTabId,
} from "@/lib/helpers/history";
import { FastLink } from "./FastLink";
import { ChevronRightIcon } from "./ui/Icons";
import { ListSkeleton } from "./ui/ListState";

const HINT: Record<HistoryTabId, string> = {
  reservations: "Past amenity bookings will show up here.",
  parcels: "Claimed packages will show up here.",
  guests: "Past guest visits will show up here.",
  activity: "Logged unit activity will show up here.",
  warranty: "Warranty requests will show up here.",
  maintenance: "Work orders will show up here.",
};

const TAB_IDS: HistoryTabId[] = [
  "reservations",
  "parcels",
  "guests",
  "activity",
  "warranty",
  "maintenance",
];

function tabLabel(item: HistoryTab) {
  return item.label.replace(/ History$/, "");
}

function TabIcon({ tab }: { tab: HistoryTabId }) {
  const d =
    tab === "parcels"
      ? "M4 8.5 12 4l8 4.5v9L12 22 4 17.5v-9Zm8 4.5 8-4.5M12 13v9"
      : tab === "guests"
        ? "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z"
        : tab === "warranty"
          ? "M12 3 5 6v6c0 5 3.2 8.4 7 9.6 3.8-1.2 7-4.6 7-9.6V6l-7-3Z"
          : tab === "maintenance"
            ? "M14.7 6.3a4 4 0 0 1 3 3L15 12l3 3-1.4 1.4L12 12l-6.3 6.3L4.3 17 12 9.3l2.7-3Z"
            : tab === "activity"
              ? "M12 5a7 7 0 1 1-7 7H3l3-3 3 3H7a5 5 0 1 0 5-5Z"
              : "M6 4h12a2 2 0 0 1 2 2v13l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2Z";
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  );
}

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

  if (loading) return <ListSkeleton rows={4} height={88} />;

  if (!visible.length) {
    return (
      <div className="ceo-hist-empty">
        <p>No history is available.</p>
        <small>Nothing is turned on for this property.</small>
      </div>
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
            {tabLabel(item)}
            <span className="ceo-hist-tabs__n">{item.items.length}</span>
          </button>
        ))}
      </div>

      {!items.length ? (
        <div className="ceo-hist-empty">
          <span className="ceo-hist-card__icon" data-kind={active?.id}>
            {active ? <TabIcon tab={active.id} /> : null}
          </span>
          <p>No history yet</p>
          <small>{active ? HINT[active.id] : "Nothing to show here yet."}</small>
        </div>
      ) : (
        <ul className="ceo-hist-list">
          {items.map((item, index) => {
            const href = active ? historyHref(active.id, item.id) : null;
            const tone = historyStatusTone(item.status);
            const body = (
              <>
                <span className="ceo-hist-card__icon" data-kind={active?.id}>
                  {active ? <TabIcon tab={active.id} /> : null}
                </span>
                <span className="ceo-wo-card__body">
                  {item.status ? (
                    <span
                      className={`ceo-wo-card__status${
                        tone ? ` ceo-wo-card__status--${tone}` : ""
                      }`}
                    >
                      <span className="ceo-wo-card__dot" aria-hidden />
                      {item.status}
                    </span>
                  ) : null}
                  <b>{item.title}</b>
                  {item.subtitle ? <small>{item.subtitle}</small> : null}
                  {item.date && !item.subtitle ? (
                    <small>{historyWhen(item.date)}</small>
                  ) : null}
                </span>
                {href ? <ChevronRightIcon className="ceo-wo-card__go" /> : null}
              </>
            );
            return (
              <li key={`${item.id}-${index}`}>
                {href ? (
                  <FastLink href={href} className="ceo-hist-card ceo-wo-card">
                    {body}
                  </FastLink>
                ) : (
                  <div className="ceo-hist-card ceo-wo-card">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
