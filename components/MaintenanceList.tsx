"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MaintenanceItem } from "@/lib/maintenance";
import { listMaintenance, loadMaintenanceOptions } from "@/lib/helpers/maintenance";
import { FastLink } from "./FastLink";
import { Card } from "./ui/Card";
import { EmptyState, ListSkeleton } from "./ui/ListState";
import { useHeldLoading } from "./ui/useLoadMore";

type Scope = "mine" | "building";
type GroupId = "progress" | "scheduled" | "completed";

const GROUPS: { id: GroupId; label: string }[] = [
  { id: "progress", label: "In Progress" },
  { id: "scheduled", label: "Scheduled" },
  { id: "completed", label: "Completed" },
];

function workOrderGroup(statusLabel: string): GroupId {
  const status = statusLabel.toLowerCase();
  if (/(complete|closed|done|resolved)/.test(status)) return "completed";
  if (/(progress|started|working|ongoing)/.test(status)) return "progress";
  return "scheduled";
}

function workOrderTitle(item: MaintenanceItem) {
  return item.maintenance_description || item.type_label || "Work order";
}

function formatWoDate(raw: string) {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return raw;
  const date = new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MaintenanceList() {
  const [scope, setScope] = useState<Scope>("mine");
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);

  const loadList = useCallback(() => {
    setLoading(true);
    setError("");
    listMaintenance({ status: "all", scope, perPage: 80 })
      .then((data) => {
        if (!data.ok) {
          setError(data.message || "Could not load work orders.");
          setItems([]);
          setCanCreate(false);
          return;
        }
        setItems(data.items);
        setCanCreate(data.can_create);
      })
      .finally(() => setLoading(false));
  }, [scope]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadMaintenanceOptions().then((data) => {
      if (typeof data?.can_create === "boolean") {
        setCanCreate(data.can_create);
      }
    });
  }, []);

  const grouped = useMemo(() => {
    const next: Record<GroupId, MaintenanceItem[]> = {
      progress: [],
      scheduled: [],
      completed: [],
    };
    for (const item of items) {
      next[workOrderGroup(item.status_label)].push(item);
    }
    return next;
  }, [items]);

  return (
    <div className="ceo-wo">
      <div className="ceo-wo-tabs" role="tablist" aria-label="Work order lists">
        <button
          type="button"
          role="tab"
          aria-selected={scope === "mine"}
          className={scope === "mine" ? "is-active" : ""}
          onClick={() => setScope("mine")}
        >
          My Requests
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "building"}
          className={scope === "building" ? "is-active" : ""}
          onClick={() => setScope("building")}
        >
          Building
        </button>
      </div>

      {pending ? (
        <ListSkeleton rows={3} height={78} />
      ) : error ? (
        <Card>
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </Card>
      ) : !items.length ? (
        <EmptyState
          subtitle={
            scope === "mine"
              ? "Submit a request when something needs attention."
              : "No building work orders yet."
          }
        >
          {scope === "mine" ? "No requests yet" : "No work orders yet"}
        </EmptyState>
      ) : (
        GROUPS.filter((group) => grouped[group.id].length).map((group) => (
          <section
            key={group.id}
            className={`ceo-wo-group ceo-wo-group--${group.id}`}
          >
            <h2 className="ceo-wo-group__title">
              <span className="ceo-wo-group__dot" aria-hidden />
              {group.label}
            </h2>
            <ul className="ceo-wo-list">
              {grouped[group.id].map((item) => (
                <li key={item.id}>
                  <FastLink
                    href={`/account/maintenance/${item.id}/edit`}
                    className="ceo-wo-card"
                  >
                    <span className="ceo-wo-card__body">
                      <b>{workOrderTitle(item)}</b>
                      <small>
                        {`#WO-${item.id}`}
                        {item.maintenance_date_request
                          ? ` • ${formatWoDate(item.maintenance_date_request)}`
                          : ""}
                      </small>
                    </span>
                    <svg
                      className="ceo-wo-card__go"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        d="M9 5.5 16 12l-7 6.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </FastLink>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {canCreate ? (
        <FastLink href="/account/maintenance/new" className="ceo-wo-fab">
          <span aria-hidden>+</span>
          New Request
        </FastLink>
      ) : null}
    </div>
  );
}
