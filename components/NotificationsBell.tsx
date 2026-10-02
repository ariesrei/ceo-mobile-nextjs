"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FastLink } from "./FastLink";
import {
  ackStaffNotifications,
  applyNotificationReads,
  loadStaffNotifications,
  peekStaffNotifications,
  rememberNotificationsRead,
  rememberStaffNotifications,
  subscribeStaffNotifications,
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
  const bellRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const closeSheet = useCallback(() => {
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      sheetRef.current?.contains(active)
    ) {
      active.blur();
    }
    setOpen(false);
    bellRef.current?.focus();
  }, []);

  const applyData = useCallback((next: StaffNotifications | null) => {
    const overlaid = next ? applyNotificationReads(next) : next;
    setData(overlaid);
    if (overlaid) rememberStaffNotifications(overlaid);
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

  useEffect(() => subscribeStaffNotifications(applyData), [applyData]);

  const confirmedOff = data !== null && !data.available;
  const showBell = !confirmedOff && (expectAvailable || Boolean(data?.available));

  if (!showBell) return null;

  const visible = (data?.types || []).filter((type) => type.items.length > 0);
  const badge = Math.min(99, data?.total_count || 0);
  const pending = loading && !hasRows(data);

  async function markAll() {
    if (acking || !data || (data.total_count || 0) < 1) return;
    setAcking(true);
    rememberNotificationsRead(data, "all");
    data.types.forEach((type) => acked.current.add(type.id));
    applyData(applyNotificationReads(data));
    try {
      const next = await ackStaffNotifications("all");
      const fresh = await loadStaffNotifications(true);
      if (!next.ok) {
        applyData(fresh);
        return;
      }
      applyData(fresh);
    } finally {
      setAcking(false);
    }
  }

  const sheet = (
    <div
      ref={sheetRef}
      className={open ? "ceo-ops-notes" : "ceo-ops-notes ceo-ops-notes--off"}
      role="dialog"
      aria-modal={open}
      aria-labelledby="ceo-notes-title"
      inert={open ? undefined : true}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSheet();
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
                      className={item.unread ? "is-unread" : undefined}
                      onClick={() => {
                        closeSheet();
                        if (!data || !item.unread) return;
                        rememberNotificationsRead(data, type.id, [item.id]);
                        applyData(data);
                      }}
                    >
                      <FastLink href={noteHref(item.href)}>
                        <NoteKind typeId={type.id} />
                        <span>
                          <strong>{item.title}</strong>
                          {item.meta ? <small>{item.meta}</small> : null}
                        </span>
                        {item.unread ? (
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
        <button type="button" onClick={closeSheet}>
          Close
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={bellRef}
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
