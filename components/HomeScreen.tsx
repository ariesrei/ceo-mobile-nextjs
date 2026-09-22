"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearBrowserTokens } from "@/lib/browser-session";
import { createPortal } from "react-dom";
import {
  getBuildAppProfile,
  isWarrantyProfile,
  showOpsCommunityUi,
  type AppProfile,
} from "@/lib/app-profile";
import { applyNavVisibility } from "@/lib/navigation";
import { QUICK_ACTION_ITEMS } from "@/lib/helpers/shortcuts";
import { loadHomeSummary, type HomeSummary } from "@/lib/helpers/home-summary";
import {
  listAnnouncements,
  listUpcomingEvents,
  type CommunityAnnouncement,
  type CommunityEvent,
} from "@/lib/helpers/events";
import type { MenuItem, NavigationResponse } from "@/lib/types";
import { AccountMenu } from "./AccountMenu";
import { BottomNav } from "./BottomNav";
import { FastLink } from "./FastLink";
import { EmptyState, ListGo, ListSkeleton } from "./ui/ListState";

const RESIDENT_HOME_IDS = [
  "profile",
  "edit_profile",
  "additional_info",
  "reservations",
  "parcels",
  "warranties",
];

const WARRANTY_HOME_IDS = ["warranties", "profile", "edit_profile"];

const COMMUNITY_RAIL: MenuItem[] = [
  { id: "home", label: "Home", path: "/account", enabled: true, group: "account" },
  { id: "messaging", label: "Messages", path: "/account/messaging", enabled: true, group: "account" },
  { id: "profile", label: "My Account", path: "/account/profile", enabled: true, group: "account" },
  { id: "maintenance", label: "Make a Request", path: "/account/maintenance", enabled: true, group: "account" },
  { id: "reservations", label: "Amenities", path: "/account/reservations", enabled: true, group: "account" },
  { id: "events", label: "Events", path: "/account/events", enabled: true, group: "account" },
  { id: "parcels", label: "Packages", path: "/account/parcels", enabled: true, group: "account" },
  { id: "documents", label: "Documents", path: "/account/documents", enabled: true, group: "account" },
  { id: "assets", label: "My Assets", path: "/account/assets", enabled: true, group: "account" },
  { id: "announcements", label: "Community", path: "/account/announcements", enabled: true, group: "account" },
  { id: "contacts", label: "Directory", path: "/account/contacts", enabled: true, group: "account" },
];

const OPS_HOME_ITEMS: MenuItem[] = [
  { id: "guests", label: "Guests", path: "/account/guests", enabled: true, group: "staff" },
  { id: "parcels", label: "Parcels", path: "/account/parcels", enabled: true, group: "staff" },
  {
    id: "maintenance",
    label: "Work Orders",
    path: "/account/maintenance",
    enabled: true,
    group: "staff",
  },
  {
    id: "activities",
    label: "Activities",
    path: "/account/activities",
    enabled: true,
    group: "staff",
  },
  {
    id: "reservations",
    label: "Reservations",
    path: "/account/reservations",
    enabled: true,
    group: "staff",
  },
];

function homeMenus(menus: MenuItem[], profile?: AppProfile | null): MenuItem[] {
  const enabled = menus.filter((m) => m.enabled);
  if (getBuildAppProfile() === "warranty" || profile === "warranty") {
    const preferred = WARRANTY_HOME_IDS.map((id) =>
      enabled.find((m) => m.id === id)
    ).filter((m): m is MenuItem => Boolean(m));
    return preferred.length ? preferred : enabled;
  }
  const isStaff = enabled.some((m) => m.group === "staff");
  if (isStaff) {
    const pinned = OPS_HOME_ITEMS.map((item) => {
      const found = menus.find((m) => m.id === item.id);
      return found ? { ...found, enabled: true, path: found.path || item.path } : item;
    });
    const rest = enabled.filter(
      (m) =>
        m.id !== "contacts" &&
        !OPS_HOME_ITEMS.some((item) => item.id === m.id)
    );
    return [...pinned, ...rest];
  }
  return RESIDENT_HOME_IDS.map((id) => enabled.find((m) => m.id === id)).filter(
    (m): m is MenuItem => Boolean(m)
  );
}

function splitPropertyName(name: string): { primary: string; secondary: string } {
  const trimmed = name.trim();
  if (!trimmed || trimmed === "Client") {
    return { primary: "YOUR PROPERTY", secondary: "" };
  }
  const atMatch = trimmed.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    return {
      primary: atMatch[1].toUpperCase(),
      secondary: `AT ${atMatch[2].toUpperCase()}`,
    };
  }
  return { primary: trimmed.toUpperCase(), secondary: "" };
}

function greetingLabel(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

function SeeAllLink({ href, label }: { href: string; label: string }) {
  return (
    <FastLink href={href} className="ceo-ops-see" aria-label={label}>
      See all
      <svg viewBox="0 0 16 16" className="ceo-ops-see__chevron" aria-hidden>
        <path
          d="M6 3.5 11 8l-5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </FastLink>
  );
}

function firstNameFrom(displayName?: string, firstName?: string): string {
  const first = (firstName || "").trim();
  if (first) return first;
  const parts = (displayName || "").trim().split(/\s+/);
  return parts[0] || "there";
}

function StatIcon({ name }: { name: "balance" | "requests" | "messages" | "events" }) {
  const path =
    name === "balance"
      ? "M12 3v18M8 8.5c.8-1 2.2-1.6 4-1.6 2.4 0 4 1.2 4 3.1 0 4.2-8 1.8-8 5.4 0 1.8 1.6 3.1 4 3.1 1.8 0 3.2-.6 4-1.6"
      : name === "requests"
        ? "M14.7 6.3a4 4 0 0 1 3 3L15 12l3 3-1.4 1.4L12 12l-6.3 6.3L4.3 17 12 9.3l2.7-3Z"
        : name === "messages"
          ? "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H8l-3.2 3.2A.8.8 0 0 1 3.5 18.6V5.5Z"
          : "M5 6h14v13H5V6Zm2-2h2v2H7V4Zm8 0h2v2h-2V4ZM5 10h14";
  return (
    <span className={`ceo-ops-stat__icon ceo-ops-stat__icon--${name}`} aria-hidden>
      <svg viewBox="0 0 24 24">
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function showOpsCommunityHome(appProfile?: AppProfile | null) {
  return showOpsCommunityUi(appProfile);
}

function parseWpDate(value: string): Date | null {
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function eventDateParts(start: string): { month: string; day: string } {
  const parsed = parseWpDate(start);
  if (!parsed) return { month: "", day: "" };
  return {
    month: parsed.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(parsed.getDate()).padStart(2, "0"),
  };
}

function eventWhen(start: string, end: string, venue: string): string {
  const from = parseWpDate(start);
  const bits: string[] = [];
  if (from) {
    bits.push(
      from.toLocaleString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    );
  } else if (start) {
    bits.push(start);
  }
  if (venue) bits.push(venue);
  return bits.join(" · ");
}

function announcementWhen(date: string): string {
  const parsed = parseWpDate(date);
  if (!parsed) return date;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}


export function HomeScreen({
  menus,
  clientName,
  clientLogo,
  clientHero,
  displayName,
  firstName,
  appProfile,
}: {
  menus: MenuItem[];
  clientName: string;
  clientLogo?: string;
  clientHero?: string;
  displayName?: string;
  firstName?: string;
  appProfile?: AppProfile | null;
}) {
  const router = useRouter();
  const [showNotes, setShowNotes] = useState(false);
  const [notesReady, setNotesReady] = useState(false);
  const [greeting, setGreeting] = useState("Good morning,");
  const [liveMenus, setLiveMenus] = useState(menus);
  const [homeSummary, setHomeSummary] = useState<HomeSummary | null>(null);
  const [opsLoading, setOpsLoading] = useState(false);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const brand = splitPropertyName(clientName);
  const name = firstNameFrom(displayName, firstName);
  const visibleMenus = useMemo(
    () => homeMenus(liveMenus, appProfile),
    [liveMenus, appProfile]
  );
  const isOpsHome = showOpsCommunityHome(appProfile);
  const isStaffHome = liveMenus.some((item) => item.group === "staff");

  useEffect(() => {
    setLiveMenus(menus);
  }, [menus]);

  useEffect(() => {
    if (!appProfile) return;
    try {
      sessionStorage.setItem("ceo_app_profile", appProfile);
    } catch {
      /* private mode */
    }
  }, [appProfile]);

  useEffect(() => {
    if (menus.length) return;
    fetch("/api/wp/navigation")
      .then((r) => r.json())
      .then((data: NavigationResponse) => {
        const filtered = applyNavVisibility(data, appProfile);
        setLiveMenus(filtered?.menus || []);
      })
      .catch(() => undefined);
  }, [menus.length, appProfile]);

  useEffect(() => {
    setGreeting(greetingLabel());
  }, []);

  useEffect(() => {
    if (name && name !== "there") {
      try {
        sessionStorage.setItem("ceo_first_name", name);
      } catch {
        /* private mode */
      }
    }
  }, [name]);

  useEffect(() => {
    if (!isOpsHome) {
      setOpsLoading(false);
      return;
    }
    let cancelled = false;
    setOpsLoading(true);
    loadHomeSummary()
      .then((summary) => {
        if (cancelled) return;
        setHomeSummary(summary);
      })
      .finally(() => {
        if (!cancelled) setOpsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpsHome]);

  useEffect(() => {
    if (!isOpsHome) {
      setBoardsLoading(false);
      return;
    }
    let cancelled = false;
    setBoardsLoading(true);
    Promise.allSettled([listUpcomingEvents(3), listAnnouncements(3)])
      .then(([nextEvents, nextAnnouncements]) => {
        if (cancelled) return;
        if (nextEvents.status === "fulfilled" && nextEvents.value.ok) {
          setEvents(nextEvents.value.items);
        }
        if (
          nextAnnouncements.status === "fulfilled" &&
          nextAnnouncements.value.ok
        ) {
          setAnnouncements(nextAnnouncements.value.items);
        }
      })
      .finally(() => {
        if (!cancelled) setBoardsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpsHome]);

  const quickMenus = isOpsHome ? QUICK_ACTION_ITEMS : [];
  const moreMenus = !isOpsHome
    ? visibleMenus
    : isStaffHome
      ? visibleMenus.filter(
          (item) => !OPS_HOME_ITEMS.some((pinned) => pinned.id === item.id)
        )
      : visibleMenus.slice(4);
  const initial = (name[0] || "U").toUpperCase();

  useEffect(() => {
    setNotesReady(true);
  }, []);

  useEffect(() => {
    if (!isOpsHome) return;
    document.body.classList.add("ceo-has-ops-rail");
    return () => document.body.classList.remove("ceo-has-ops-rail");
  }, [isOpsHome]);

  return (
    <div
      className={`ceo-home ceo-app mx-auto min-h-dvh w-full${
        isOpsHome ? " ceo-ops-home" : " pb-[calc(6.75rem+env(safe-area-inset-bottom))]"
      }`}
    >
      {isOpsHome ? (
        <aside className="ceo-ops-rail">
          <div className="ceo-ops-rail__brand">
            {clientLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clientLogo} alt="" />
            ) : null}
            <div>
              <p>{brand.primary}</p>
              {brand.secondary ? <p>{brand.secondary}</p> : null}
            </div>
          </div>
          <div className="ceo-ops-rail__hello">
            <span className="ceo-ops-avatar" aria-hidden>
              {initial}
            </span>
            <div>
              <p>{greeting}</p>
              <strong>{name}</strong>
            </div>
          </div>
          <AccountMenu menus={COMMUNITY_RAIL} variant="rail" />
          <div className="ceo-ops-rail__refer">
            <span className="ceo-ops-rail__refer-icon" aria-hidden>
              <svg viewBox="0 0 24 24">
                <path
                  d="M14.7 6.3a4 4 0 0 1 3 3L15 12l3 3-1.4 1.4L12 12l-6.3 6.3L4.3 17 12 9.3l2.7-3Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <b>Refer a Neighbor</b>
            <p>Earn a $100 credit!</p>
            <span>Invite Now</span>
          </div>
          <div className="ceo-ops-rail__tools">
            <FastLink
              href="/account/preferences"
              className="ceo-ops-rail__tool"
              data-tone="orange"
              aria-label="Settings"
            >
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M12 4v2.2M12 17.8V20M4.9 7l1.6 1.6M17.5 15.4 19.1 17M4 12h2.2M17.8 12H20M4.9 17l1.6-1.6M17.5 8.6 19.1 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </FastLink>
            <FastLink
              href="/account/messaging"
              className="ceo-ops-rail__tool"
              data-tone="sky"
              aria-label="Help"
            >
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M9.6 9.4a2.5 2.5 0 0 1 4.7.8c0 1.6-2.3 1.8-2.3 3.2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16.4" r="0.8" fill="currentColor" />
              </svg>
            </FastLink>
            <button
              type="button"
              className="ceo-ops-rail__tool"
              data-tone="rose"
              aria-label="Log out"
              onClick={async () => {
                clearBrowserTokens();
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
                router.refresh();
              }}
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="M10 7V5.6A1.6 1.6 0 0 1 11.6 4h7.8A1.6 1.6 0 0 1 21 5.6v12.8A1.6 1.6 0 0 1 19.4 20h-7.8A1.6 1.6 0 0 1 10 18.4V17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <path
                  d="M4 12h10M11 8.5 14.5 12 11 15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </aside>
      ) : null}

      <div className="ceo-ops-main">
      <section className="ceo-home-hero relative overflow-hidden">
        {/* Separate layer rather than a background on the section itself: an
            inline background-image would replace the fallback gradient, so a
            property with no photo — or an unreachable one — would paint flat. */}
        {clientHero ? (
          <div
            className="ceo-home-hero__photo"
            style={{ backgroundImage: `url(${clientHero})` }}
            aria-hidden
          />
        ) : null}
        <div className="ceo-home-hero__shade" aria-hidden />
        <header className="relative z-10 flex items-start justify-between px-5 pt-5 md:px-8 md:pt-7">
          <div className="flex min-w-0 items-center gap-3 ceo-ops-topbrand">
            {clientLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clientLogo}
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg object-contain"
              />
            ) : (
              <span className="ceo-home-mark" aria-hidden>
                <svg viewBox="0 0 32 32" className="h-9 w-9">
                  <path
                    d="M6 26V12l5-3 5 3v14M16 26V9l5-3 5 3v17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
            <div className="min-w-0 text-left leading-tight">
              <p className="truncate text-[15px] font-semibold tracking-[0.14em] text-white">
                {brand.primary}
              </p>
              {brand.secondary ? (
                <p className="truncate text-[11px] font-medium tracking-[0.16em] text-white/80">
                  {brand.secondary}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="ceo-home-bell"
              aria-label="Notifications"
              onClick={() => setShowNotes(true)}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <path
                  d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 18.5a2 2 0 0 0 4 0"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {isOpsHome ? (
              <span className="ceo-ops-avatar" aria-hidden>
                {initial}
              </span>
            ) : null}
          </div>
        </header>

        <div className={`relative z-10 flex flex-1 flex-col justify-end px-5 pt-20 md:px-8${isOpsHome ? " ceo-ops-hero__copy" : " pb-16 md:pb-20 md:pt-24"}`}>
          <div className="ceo-ops-hero__phone">
            <p className="text-[clamp(1rem,4.2vw,1.25rem)] font-normal text-white/90 md:text-[24px]">{greeting}</p>
            <p className="mt-1 text-[clamp(1.65rem,8vw,2.125rem)] font-semibold leading-none tracking-tight text-white md:text-[48px]">
              {name} <span aria-hidden>👋</span>
            </p>
          </div>
          {isOpsHome ? (
            <div className="ceo-ops-hero__wide">
              <p className="ceo-ops-hero__kicker">{greeting} {name}</p>
              <h1>
                Your Community.
                <span> At Your Fingertips.</span>
              </h1>
              <p className="ceo-ops-hero__lede">
                Stay connected, informed, and in control of your community.
              </p>
              <FastLink href="/account/reservations" className="ceo-ops-hero__cta">
                Explore Amenities
              </FastLink>
            </div>
          ) : null}
        </div>
      </section>

      <section className="ceo-home-sheet relative z-20 -mt-8 px-4 pb-8 md:px-6">
        <div className="ceo-ops-sheet rounded-t-[28px] bg-[var(--bg)] px-3 pb-8 pt-5 md:px-5 md:pt-6">
          <div className="ceo-ops-handle mx-auto h-1 w-10 rounded-full bg-white/15" />
          {!isOpsHome ? (
            <AccountMenu menus={visibleMenus} variant="home" />
          ) : (
            <>
              {opsLoading && !homeSummary ? (
                <div className="ceo-ops-stats">
                  {["balance", "requests", "messages", "events"].map((id) => (
                    <div key={id} className="ceo-ops-stat ceo-skel h-[132px]" />
                  ))}
                </div>
              ) : (
                <section className="ceo-ops-stats">
                  <FastLink
                    href="/account/pay"
                    prefetch={false}
                    className="ceo-ops-stat ceo-ops-stat--soon ceo-ops-stat--balance"
                    data-tone="green"
                    aria-label="Account Balance, under construction"
                  >
                    <StatIcon name="balance" />
                    <span className="ceo-ops-stat__l">Account Balance</span>
                    <span className="ceo-ops-stat__soon">Under construction</span>
                  </FastLink>
                  <FastLink
                    href="/account/maintenance"
                    prefetch={false}
                    className="ceo-ops-stat"
                    data-tone="teal"
                  >
                    <StatIcon name="requests" />
                    <span className="ceo-ops-stat__l">Open Requests</span>
                    <span className="ceo-ops-stat__n">
                      {homeSummary?.open_requests ?? 0}
                    </span>
                    <span className="ceo-ops-stat__go">View requests</span>
                  </FastLink>
                  <FastLink
                    href="/account/messaging"
                    prefetch={false}
                    className="ceo-ops-stat ceo-ops-stat--soon"
                    data-tone="sky"
                    aria-label="Messages, under construction"
                  >
                    <StatIcon name="messages" />
                    <span className="ceo-ops-stat__l">Messages</span>
                    <span className="ceo-ops-stat__soon">Under construction</span>
                  </FastLink>
                  <FastLink
                    href="/account/events"
                    prefetch={false}
                    className="ceo-ops-stat"
                    data-tone="purple"
                  >
                    <StatIcon name="events" />
                    <span className="ceo-ops-stat__l">Upcoming Events</span>
                    <span className="ceo-ops-stat__n">
                      {homeSummary?.upcoming_events ?? 0}
                    </span>
                    <span className="ceo-ops-stat__go">View calendar</span>
                  </FastLink>
                </section>
              )}
              {quickMenus.length ? (
                <section className="ceo-ops-panel ceo-ops-panel--actions">
                  <div className="ceo-ops-panel__head">
                    <h2>Quick Actions</h2>
                    <SeeAllLink href="/account/actions" label="All quick actions" />
                  </div>
                  <AccountMenu menus={quickMenus} variant="actions" />
                </section>
              ) : null}
              <div className="ceo-ops-split">
                <section className="ceo-ops-panel ceo-ops-panel--news">
                  <div className="ceo-ops-panel__head">
                    <h2>Community Announcements</h2>
                    <SeeAllLink
                      href="/account/announcements"
                      label="All announcements"
                    />
                  </div>
                  {boardsLoading ? (
                    <ListSkeleton rows={3} height={64} />
                  ) : announcements.length ? (
                    <ul className="ceo-ops-news">
                      {announcements.map((item) => (
                        <li key={item.id}>
                          <FastLink href={`/account/announcements/${item.id}`}>
                            {item.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.photo} alt="" />
                            ) : (
                              <span className="ceo-ops-news__mark" aria-hidden>
                                {(item.title[0] || "A").toUpperCase()}
                              </span>
                            )}
                            <span className="ceo-ops-news__body">
                              <b>{item.title}</b>
                              {item.excerpt ? <em>{item.excerpt}</em> : null}
                              <small>{announcementWhen(item.date)}</small>
                            </span>
                            <ListGo icon="horn" />
                          </FastLink>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon="horn"
                      compact
                      subtitle="Community posts will show up here."
                    >
                      No announcements yet
                    </EmptyState>
                  )}
                </section>
                <section className="ceo-ops-panel ceo-ops-panel--events">
                  <div className="ceo-ops-panel__head">
                    <h2>Upcoming Events</h2>
                    <SeeAllLink href="/account/events" label="All events" />
                  </div>
                  {boardsLoading ? (
                    <ListSkeleton rows={3} height={64} />
                  ) : events.length ? (
                    <ul className="ceo-ops-events">
                      {events.map((item) => {
                        const date = eventDateParts(item.start);
                        return (
                          <li key={item.id}>
                            <FastLink href={`/account/events/${item.id}`}>
                              {item.photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.photo}
                                  alt=""
                                  className="ceo-ops-events__photo"
                                />
                              ) : (
                                <span className="ceo-ops-events__date">
                                  {date.month ? <small>{date.month}</small> : null}
                                  <strong>{date.day || "—"}</strong>
                                </span>
                              )}
                              <span className="ceo-ops-events__body">
                                <b>{item.title}</b>
                                <em>{eventWhen(item.start, item.end, item.venue)}</em>
                              </span>
                              <ListGo icon="calendar" />
                            </FastLink>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <EmptyState
                      icon="calendar"
                      compact
                      subtitle="New events will appear here."
                    >
                      No upcoming events
                    </EmptyState>
                  )}
                </section>
              </div>
              {moreMenus.length ? (
                <section className="ceo-ops-panel ceo-ops-panel--more">
                  <div className="ceo-ops-panel__head">
                    <h2>Account</h2>
                  </div>
                  <AccountMenu menus={moreMenus} variant="home" />
                </section>
              ) : null}
            </>
          )}
        </div>
      </section>
      </div>
      <BottomNav
        appProfile={appProfile}
        variant={isWarrantyProfile(appProfile) ? "warranty" : "app"}
      />
      {showNotes && notesReady
        ? createPortal(
            <div
              className="ceo-ops-notes"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ceo-home-notes-title"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowNotes(false);
              }}
            >
              <div className="ceo-ops-notes__sheet">
                <h2 id="ceo-home-notes-title">Notifications</h2>
                <p>You have no new notifications.</p>
                <button type="button" onClick={() => setShowNotes(false)}>
                  Close
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
