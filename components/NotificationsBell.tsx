"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FastLink } from "./FastLink";
import {
  ackStaffNotifications,
  loadStaffNotifications,
  peekStaffNotifications,
  rememberStaffNotifications,
  type StaffNotifications,
} from "@/lib/helpers/notifications";
import {
  BellIcon,
  BuildingIcon,
  ChevronRightIcon,
  ClipboardIcon,
  FileIcon,
  UserCheckIcon,
} from "./ui/Icons";
import { SkelChip, SkelLine } from "./ui/ListState";

function NoteKind({ typeId }: { typeId: string }) {
  const Icon =
    typeId === "maintenance"
      ? ClipboardIcon
      : typeId === "unit_entry"
        ? BuildingIcon
        : typeId === "gatekeeper"
          ? UserCheckIcon
          : typeId.startsWith("warranty") || typeId === "company_coi_expired"
            ? FileIcon
            : BellIcon;
  return (
    <span className="ceo-ops-notes__kind" aria-hidden>
      <Icon />
    </span>
  );
}

function NotesSkeleton() {
  return (
    <div className="ceo-ops-notes__list" role="status" aria-label="Loading">
      <section className="ceo-ops-notes__group">
        <header>
          <SkelLine width="6.2rem" />
          <SkelChip width="1.2rem" />
        </header>
        <ul>
          <li>
            <SkelLine width="78%" />
            <SkelLine width="54%" />
          </li>
        </ul>
      </section>
    </div>
  );
}

function hasRows(data: StaffNotifications | null): boolean {
  return Boolean(data?.types.some((type) => type.items.length > 0));
}

function noteHref(href: string): string {
  const path = href.trim() || "/account";
  if (typeof window === "undefined") return path;
  if (!path.startsWith("/account/profile")) return path;
  if (!window.location.pathname.startsWith("/account/warranties")) return path;
  const next = new URL(path, "https://ceo.local");
  if (!next.searchParams.get("from")) next.searchParams.set("from", "warranty");
  return `${next.pathname}${next.search}`;
}

function clearType(
  current: StaffNotifications,
  typeId: string,
  totals?: { total_count: number; has_unread: boolean }
): StaffNotifications {
  const types = current.types.map((type) =>
    type.id === typeId ? { ...type, count: 0 } : type
  );
  return {
    ...current,
    types,
    total_count:
      totals?.total_count ??
      types.reduce((sum, type) => sum + Math.max(0, type.count), 0),
    has_unread: totals?.has_unread ?? types.some((type) => type.count > 0),
  };
}

export function NotificationsBell({
  className = "",
  expectAvailable = false,
}: {
  className?: string;
  expectAvailable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<StaffNotifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [acking, setAcking] = useState(false);
  const acked = useRef(new Set<string>());

  const applyData = useCallback((next: StaffNotifications | null) => {
    setData(next);
    if (next) rememberStaffNotifications(next);
  }, []);

  useEffect(() => {
    setMounted(true);
    const warm = peekStaffNotifications();
    if (warm) {
      applyData(warm);
      setLoading(!hasRows(warm));
    }
    let cancelled = false;
    loadStaffNotifications(true)
      .then((next) => {
        if (!cancelled) applyData(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyData]);

  const markType = useCallback(
    async (typeId: string) => {
      if (acked.current.has(typeId)) return;
      acked.current.add(typeId);
      setData((prev) => {
        if (!prev) return prev;
        const next = clearType(prev, typeId);
        rememberStaffNotifications(next);
        return next;
      });
      const result = await ackStaffNotifications(typeId);
      if (!result.ok) {
        acked.current.delete(typeId);
        applyData(await loadStaffNotifications(true));
        return;
      }
      setData((prev) => {
        if (!prev) return prev;
        const next = clearType(prev, typeId, result);
        rememberStaffNotifications(next);
        return next;
      });
    },
    [applyData]
  );

  const confirmedOff = data !== null && !data.available;
  const showBell = !confirmedOff && (expectAvailable || Boolean(data?.available));

  if (!showBell) return null;

  const visible = (data?.types || []).filter(
    (type) => type.count > 0 && type.items.length > 0
  );
  const badge = Math.min(99, data?.total_count || 0);
  const pending = loading && !hasRows(data);

  async function markAll() {
    if (acking) return;
    setAcking(true);
    try {
      const next = await ackStaffNotifications("all");
      const fresh = await loadStaffNotifications(true);
      if (!next.ok) {
        applyData(fresh);
        return;
      }
      const merged = {
        ...fresh,
        total_count: next.total_count,
        has_unread: next.has_unread,
      };
      applyData(merged);
      fresh.types.forEach((type) => {
        if (type.count < 1) acked.current.add(type.id);
      });
    } finally {
      setAcking(false);
    }
  }

  const sheet = (
    <div
      className={open ? "ceo-ops-notes" : "ceo-ops-notes ceo-ops-notes--off"}
      role="dialog"
      aria-modal={open}
      aria-hidden={!open}
      aria-labelledby="ceo-notes-title"
      inert={open ? undefined : true}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="ceo-ops-notes__sheet">
        <div className="ceo-ops-notes__head">
          <h2 id="ceo-notes-title">Notifications</h2>
          <button
            type="button"
            className={`ceo-ops-notes__mark${
              (data?.total_count || 0) > 0 ? "" : " is-quiet"
            }`}
            disabled={acking || (data?.total_count || 0) < 1}
            onClick={() => void markAll()}
          >
            Mark all read
          </button>
        </div>
        {pending ? (
          <NotesSkeleton />
        ) : visible.length ? (
          <div className="ceo-ops-notes__list">
            {visible.map((type) => (
              <section key={type.id} className="ceo-ops-notes__group">
                <header>
                  <span>{type.group_label || type.label}</span>
                  {type.count > 0 ? <b>{type.count}</b> : null}
                </header>
                <ul>
                  {type.items.map((item) => (
                    <li
                      key={`${type.id}-${item.id}`}
                      className={type.count > 0 ? "is-unread" : undefined}
                      onClick={() => {
                        setOpen(false);
                        if (!type.skip_mark_seen && type.count > 0) {
                          void markType(type.id);
                        }
                      }}
                    >
                      <FastLink href={noteHref(item.href)}>
                        <NoteKind typeId={type.id} />
                        <span>
                          <strong>{item.title}</strong>
                          {item.meta ? <small>{item.meta}</small> : null}
                        </span>
                        {type.count > 0 ? (
                          <i className="ceo-ops-notes__pip" aria-hidden />
                        ) : (
                          <ChevronRightIcon className="ceo-ops-notes__go" />
                        )}
                      </FastLink>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="ceo-ops-notes__list">
            <p>You are all caught up.</p>
          </div>
        )}
        <button type="button" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className={`ceo-home-bell${className ? ` ${className}` : ""}`}
        aria-label={
          badge > 0 ? `Notifications, ${badge} unread` : "Notifications"
        }
        onClick={() => {
          setOpen(true);
          void loadStaffNotifications(true).then(applyData);
        }}
      >
        <BellIcon className="h-6 w-6" />
        {badge > 0 ? <span className="ceo-home-bell__badge">{badge}</span> : null}
      </button>
      {mounted ? createPortal(sheet, document.body) : null}
    </>
  );
}
