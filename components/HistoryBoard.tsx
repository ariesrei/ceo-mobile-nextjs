"use client";

import { useEffect, useState } from "react";
import { useHeldLoading, useLoadMore } from "./ui/useLoadMore";
import {
  historyWhen,
  listCommunityHistory,
  type HistoryFeedItem,
  type HistoryKind,
} from "@/lib/helpers/history";
import { EmptyState, ListSkeleton, LoadingDots } from "./ui/ListState";

const TABS = [
  { id: "activity", label: "Activity" },
  { id: "transactional", label: "Transactions" },
] as const;

const PREVIEW = 4;

function HistoryIcon({ kind }: { kind: HistoryKind }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (kind === "reservation") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3.4V7M16 3.4V7M4 10h16" />
      </svg>
    );
  }
  if (kind === "parcel") {
    return (
      <svg {...common}>
        <path d="M4 8.6 12 4l8 4.6v9.2L12 22 4 17.8V8.6Z" />
        <path d="M12 13 4.2 8.6M12 13l7.8-4.4M12 13v9" />
      </svg>
    );
  }
  if (kind === "payment") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18M7 14h4" />
      </svg>
    );
  }
  if (kind === "guest") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8.2" r="3.2" />
        <path d="M5.2 19c.8-3.4 3.3-5 6.8-5s6 1.6 6.8 5" />
      </svg>
    );
  }
  if (kind === "warranty") {
    return (
      <svg {...common}>
        <path d="M12 3.4 19 6.2v5.4c0 4.4-2.9 7.6-7 9-4.1-1.4-7-4.6-7-9V6.2L12 3.4Z" />
        <path d="m9 12 2.1 2.1L15.4 10" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
      <path d="m8.2 12.2 2.4 2.4 5.2-5.3" />
    </svg>
  );
}

function iconTone(
  color: string
): { background: string; color: string; borderColor: string } | undefined {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return undefined;
  const hex = color.length === 4
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const light = r * 0.299 + g * 0.587 + b * 0.114 > 160;
  return {
    background: color,
    color: light ? "#081014" : "#fff",
    borderColor: "transparent",
  };
}

export function HistoryBoard() {
  const [activity, setActivity] = useState<HistoryFeedItem[]>([]);
  const [transactional, setTransactional] = useState<HistoryFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("activity");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    listCommunityHistory()
      .then((data) => {
        setActivity(data.activity);
        setTransactional(data.transactional);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setExpanded(false);
  }, [tab]);

  const items = tab === "activity" ? activity : transactional;
  const previewing = !expanded && items.length > PREVIEW;
  const { visible, hasMore, loadingMore, sentinelRef } = useLoadMore(
    previewing ? PREVIEW : items.length,
    expanded ? 15 : PREVIEW,
    `${tab}-${expanded ? "all" : "preview"}`
  );
  const shown = items.slice(0, visible);

  return (
    <div className="ceo-hist">
      <div className="ceo-hist-tabs" role="tablist" aria-label="History type">
        {TABS.map((item) => (
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

      {!pending && items.length ? (
        <h2 className="ceo-hist__heading">
          {tab === "activity" ? "Recent Activity" : "Transactions"}
        </h2>
      ) : null}

      {pending ? (
        <ListSkeleton rows={4} height={72} />
      ) : shown.length ? (
        <ul className="ceo-hist-list">
          {shown.map((item) => (
            <li key={item.id} className="ceo-hist-row">
              <span
                className="ceo-hist-row__icon"
                data-kind={item.kind}
                style={iconTone(item.color)}
                aria-hidden
              >
                {item.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.icon} alt="" />
                ) : (
                  <HistoryIcon kind={item.kind} />
                )}
              </span>
              <span className="ceo-hist-row__body">
                <b>{item.title}</b>
                {item.subtitle ? <em>{item.subtitle}</em> : null}
                <small>{historyWhen(item.date)}</small>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="inbox"
          subtitle={
            tab === "activity"
              ? "Account activity will show up here."
              : "Payments and charges will show up here."
          }
        >
          {tab === "activity" ? "No recent activity" : "No payments yet"}
        </EmptyState>
      )}

      {!pending && previewing ? (
        <button
          type="button"
          className="ceo-hist-all"
          onClick={() => setExpanded(true)}
        >
          View all history
        </button>
      ) : null}

      {!pending && expanded && (hasMore || loadingMore) ? (
        <div
          ref={sentinelRef}
          className="ceo-hist-more"
          role="status"
          aria-live="polite"
          aria-label={loadingMore ? "Loading more" : "Scroll for more"}
        >
          {loadingMore ? <LoadingDots /> : null}
        </div>
      ) : null}
    </div>
  );
}
