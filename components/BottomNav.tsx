"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  getBuildAppProfile,
  isWarrantyProfile,
  normalizeAppProfile,
  type AppProfile,
} from "@/lib/app-profile";
import { applyNavVisibility, menuHref } from "@/lib/navigation";
import { clearBrowserTokens } from "@/lib/browser-session";
import type { MenuItem, NavigationResponse } from "@/lib/types";

const ICONS: Record<string, string> = {
  home: "M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z",
  parcels:
    "M4 8.5 12 4l8 4.5v9L12 22 4 17.5v-9Zm8 4.5 8-4.5M12 13v9",
  warranties:
    "M12 3 5 6v6c0 5 3.2 8.4 7 9.6 3.8-1.2 7-4.6 7-9.6V6l-7-3Z",
  maintenance:
    "M14.7 6.3a4 4 0 0 1 3 3L15 12l3 3-1.4 1.4L12 12l-6.3 6.3L4.3 17 12 9.3l2.7-3Z",
  profile:
    "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z",
  reservations:
    "M6 4h12a2 2 0 0 1 2 2v13l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2Z",
  edit_profile:
    "M4 17.5V20h2.5l8.4-8.4-2.5-2.5L4 17.5Zm13.7-8.2a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-1.2 1.2 2.5 2.5 1.7-1.7Z",
  additional_info:
    "M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm1 4h-2v5h2Zm0 6h-2v2h2Z",
  history:
    "M12 5a7 7 0 1 1-7 7H3l3-3 3 3H7a5 5 0 1 0 5-5Z",
  claims: "M12 3 5.5 5.8v5.7c0 4.3 2.7 7.4 6.5 8.7 3.8-1.3 6.5-4.4 6.5-8.7V5.8L12 3Z",
  reports: "M4 20h16M7 20v-6M12 20V7M17 20v-9",
  settings:
    "M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.5 1.5 0 0 0 .32 1.7l.08.08a1.9 1.9 0 1 1-2.7 2.7l-.08-.08a1.5 1.5 0 0 0-2.55 1.08V21a1.9 1.9 0 1 1-3.8 0v-.52a1.5 1.5 0 0 0-2.55-1.08l-.08.08a1.9 1.9 0 1 1-2.7-2.7l.08-.08A1.5 1.5 0 0 0 4.6 15a1.5 1.5 0 0 0-1.32-.86H3a1.9 1.9 0 1 1 0-3.8h.28A1.5 1.5 0 0 0 4.6 9a1.5 1.5 0 0 0-.32-1.7l-.08-.08a1.9 1.9 0 1 1 2.7-2.7l.08.08A1.5 1.5 0 0 0 9.53 3.5V3a1.9 1.9 0 1 1 3.8 0v.5a1.5 1.5 0 0 0 2.55 1.08l.08-.08a1.9 1.9 0 1 1 2.7 2.7l-.08.08A1.5 1.5 0 0 0 19.4 9a1.5 1.5 0 0 0 1.32.86H21a1.9 1.9 0 1 1 0 3.8h-.28A1.5 1.5 0 0 0 19.4 15Z",
  vendors:
    "M4 7.4A1.4 1.4 0 0 1 5.4 6h3.3l1.7 1.9h8.2A1.4 1.4 0 0 1 20 9.3v8.3a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 17.6V7.4Z",
  more: "M5 12.5A1.5 1.5 0 1 1 5 9.5a1.5 1.5 0 0 1 0 3Zm7 0A1.5 1.5 0 1 1 12 9.5a1.5 1.5 0 0 1 0 3Zm7 0A1.5 1.5 0 1 1 19 9.5a1.5 1.5 0 0 1 0 3Z",
  more_grid:
    "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  messaging:
    "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H8l-3.2 3.2A.8.8 0 0 1 3.5 18.6V5.5Z",
  entry_pass:
    "M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5v-9ZM6 10h5M6 13.5h7",
};

/**
 * The module's tab bar draws the selected tab as a solid glyph and the rest as
 * thin outlines, so those tabs need a stroked path of their own — stroking the
 * solid paths above traces their silhouette instead of the shape inside it.
 */
const OUTLINE_ICONS: Record<string, string> = {
  home: "M4.6 10.9 12 4.8l7.4 6.1v7.9a1 1 0 0 1-1 1h-3.6v-5.3H9.2v5.3H5.6a1 1 0 0 1-1-1v-7.9Z",
  claims: "M12 3.9 6.3 6.3v5.2c0 3.9 2.4 6.7 5.7 7.9 3.3-1.2 5.7-4 5.7-7.9V6.3L12 3.9Z",
  reports: "M4.6 19.4h14.8M7.4 19.4v-5.4M12 19.4V7.2M16.6 19.4v-8",
  settings:
    "M12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM19 14.2a1.3 1.3 0 0 0 .28 1.46l.08.08a1.6 1.6 0 1 1-2.26 2.26l-.08-.08a1.3 1.3 0 0 0-2.2.92V19.4a1.6 1.6 0 1 1-3.2 0v-.56a1.3 1.3 0 0 0-2.2-.92l-.08.08a1.6 1.6 0 1 1-2.26-2.26l.08-.08A1.3 1.3 0 0 0 5 14.2a1.3 1.3 0 0 0-1.14-.74H3.6a1.6 1.6 0 1 1 0-3.2h.26A1.3 1.3 0 0 0 5 9.52a1.3 1.3 0 0 0-.28-1.46l-.08-.08a1.6 1.6 0 1 1 2.26-2.26l.08.08a1.3 1.3 0 0 0 2.2-.92V4.6a1.6 1.6 0 1 1 3.2 0v.28a1.3 1.3 0 0 0 2.2.92l.08-.08a1.6 1.6 0 1 1 2.26 2.26l-.08.08A1.3 1.3 0 0 0 19 9.52a1.3 1.3 0 0 0 1.14.74h.26a1.6 1.6 0 1 1 0 3.2h-.26A1.3 1.3 0 0 0 19 14.2Z",
  vendors:
    "M4.7 7.7a.9.9 0 0 1 .9-.9h3l1.7 1.9h8.1a.9.9 0 0 1 .9.9v7.7a.9.9 0 0 1-.9.9H5.6a.9.9 0 0 1-.9-.9V7.7Z",
  reservations:
    "M6.5 5.2h11A1.5 1.5 0 0 1 19 6.7v11.6l-3.4-1.6-3.6 1.8-3.6-1.8-3.4 1.6V6.7A1.5 1.5 0 0 1 6.5 5.2Z",
  messaging:
    "M5.2 5.2h13.6A1.6 1.6 0 0 1 20.4 6.8v7.2a1.6 1.6 0 0 1-1.6 1.6H8.4L4.8 19V6.8A1.6 1.6 0 0 1 6.4 5.2H5.2Z",
  entry_pass:
    "M4.4 7.2h15.2A1.2 1.2 0 0 1 20.8 8.4v7.2a1.2 1.2 0 0 1-1.2 1.2H4.4A1.2 1.2 0 0 1 3.2 15.6V8.4A1.2 1.2 0 0 1 4.4 7.2ZM6.4 10.4h5.2M6.4 13.4h7.2",
  more_grid:
    "M4.6 4.6h5.2v5.2H4.6V4.6Zm9.6 0h5.2v5.2h-5.2V4.6ZM4.6 14.2h5.2v5.2H4.6v-5.2Zm9.6 0h5.2v5.2h-5.2v-5.2Z",
};

/**
 * The Warranty module ships its own fixed tab set, matching the Warranty app
 * design. Everywhere else the tabs are still built from the property's
 * WordPress menu configuration, which differs per property and per role.
 */
const WARRANTY_TABS = [
  { id: "home", label: "Home", path: "/account/warranties" },
  { id: "claims", label: "Claims", path: "/account/warranties/claims" },
  { id: "vendors", label: "Vendors", path: "/account/warranties/vendors" },
];

const COMMUNITY_TABS = [
  { id: "home", label: "Home", path: "/account" },
  { id: "messaging", label: "Messages", path: "/account/messaging" },
  { id: "reservations", label: "Amenities", path: "/account/reservations" },
  { id: "entry_pass", label: "Unit Entry", path: "/account/entry-pass" },
];

function CommunityIcon({ id }: { id: string }) {
  const props = {
    viewBox: "0 0 24 24",
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (id === "messaging") {
    return (
      <svg {...props}>
        <path d="M5 6.2h14A1.8 1.8 0 0 1 20.8 8v7.2A1.8 1.8 0 0 1 19 17H8.4L4.6 20v-3H5A1.8 1.8 0 0 1 3.2 15.2V8A1.8 1.8 0 0 1 5 6.2Z" />
      </svg>
    );
  }
  if (id === "reservations") {
    return (
      <svg {...props}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3.4V7M16 3.4V7M4 10h16" />
      </svg>
    );
  }
  if (id === "entry_pass") {
    return (
      <svg {...props}>
        <rect x="3.5" y="6" width="17" height="12" rx="2" />
        <path d="M6.4 10.2h5M6.4 13.4h7.2" />
      </svg>
    );
  }
  if (id === "more_grid") {
    return (
      <svg {...props}>
        <rect x="4" y="4" width="6.2" height="6.2" rx="1.3" />
        <rect x="13.8" y="4" width="6.2" height="6.2" rx="1.3" />
        <rect x="4" y="13.8" width="6.2" height="6.2" rx="1.3" />
        <rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.3" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M4.2 11 12 4.2 19.8 11v8.6H4.2V11Z" />
      <path d="M10 19.6v-5.4h4v5.4" />
    </svg>
  );
}

function Icon({ id, outline = false }: { id: string; outline?: boolean }) {
  const stroked = outline && OUTLINE_ICONS[id];
  if (stroked) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={stroked} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d={ICONS[id] || ICONS.more} />
    </svg>
  );
}

const STAFF_IDS = ["guests", "parcels", "maintenance"];
const RESIDENT_IDS = ["profile", "parcels"];
const WARRANTY_IDS = ["warranties"];

function tabLabel(item: MenuItem): string {
  if (item.id === "warranties") return "Warranty";
  if (item.id === "profile") return "View Profile";
  if (item.id === "edit_profile") return "Edit Profile";
  if (item.id === "entry_pass") return "Unit Entry Authorization";
  return item.label.replace(/^My /, "");
}

function MoreSheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const lastY = useRef(0);
  const active = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function atTop() {
    return !scrollRef.current || scrollRef.current.scrollTop <= 0;
  }

  function finishDrag() {
    if (!active.current) return;
    active.current = false;
    setDragging(false);
    if (offset > 72 || lastY.current - startY.current > 72) {
      onClose();
      return;
    }
    setOffset(0);
  }

  function onHandleDown(e: PointerEvent<HTMLElement>) {
    startY.current = e.clientY;
    lastY.current = e.clientY;
    active.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onHandleMove(e: PointerEvent<HTMLElement>) {
    if (!active.current) return;
    lastY.current = e.clientY;
    const dy = e.clientY - startY.current;
    setOffset(Math.max(0, dy));
  }

  function onBodyDown(e: PointerEvent<HTMLDivElement>) {
    if (!atTop()) return;
    startY.current = e.clientY;
    lastY.current = e.clientY;
    active.current = true;
  }

  function onBodyMove(e: PointerEvent<HTMLDivElement>) {
    if (!active.current) return;
    lastY.current = e.clientY;
    const dy = e.clientY - startY.current;
    if (dy > 8 && atTop()) {
      if (!dragging) setDragging(true);
      setOffset(dy);
      e.preventDefault();
    } else if (dy <= 0) {
      active.current = false;
      setDragging(false);
      setOffset(0);
    }
  }

  return (
    <div
      className="ceo-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="More"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`ceo-sheet${dragging ? " is-dragging" : ""}`}
        style={{ transform: `translateY(${offset}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="ceo-sheet__grab"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <button type="button" className="ceo-sheet__handle" aria-label="Close more" />
        </div>
        <div
          ref={scrollRef}
          className="ceo-sheet__body"
          onPointerDown={onBodyDown}
          onPointerMove={onBodyMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function communityMoreItems(items: MenuItem[]): MenuItem[] {
  const mapped = items
    .filter((item) => item.id !== "guests" && item.path !== "/account/guests")
    .map((item) =>
    item.id === "additional_info"
      ? { ...item, label: "My Assets", path: "/account/assets" }
      : item
  );
  if (!mapped.some((item) => item.path === "/account/assets")) {
    mapped.unshift({
      id: "assets",
      label: "My Assets",
      path: "/account/assets",
      enabled: true,
      group: "account",
    });
  }
  return mapped;
}

export function BottomNav({
  variant = "app",
  appProfile,
}: {
  variant?: "app" | "warranty";
  appProfile?: AppProfile | null;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const themeLock = useRef(true);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const [liveProfile, setLiveProfile] = useState<AppProfile | null>(() => {
    if (appProfile) return appProfile;
    if (getBuildAppProfile() === "operations") return "operations";
    try {
      return normalizeAppProfile(sessionStorage.getItem("ceo_app_profile"));
    } catch {
      return null;
    }
  });

  const community =
    variant !== "warranty" && getBuildAppProfile() !== "warranty";

  useEffect(() => {
    setDocked(true);
  }, []);

  useEffect(() => {
    const ops = community;
    const war = variant === "warranty" && !community;
    themeLock.current = ops || war;
    document.body.classList.toggle("ceo-ops-theme", ops);
    document.body.classList.toggle("ceo-warranty-theme", war);
    return () => {
      themeLock.current = false;
      document.body.classList.remove("ceo-ops-theme");
      document.body.classList.remove("ceo-warranty-theme");
    };
  }, [community, variant]);

  useEffect(() => {
    const key = "ceo_nav_menus_v1";
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { at: number; menus: MenuItem[] };
        if (parsed?.menus && Date.now() - parsed.at < 120_000) {
          setMenus(parsed.menus);
        }
      }
    } catch {
      /* ignore */
    }
    fetch("/api/wp/navigation")
      .then((r) => r.json())
      .then((data: NavigationResponse) => {
        let stored: AppProfile | null = null;
        try {
          stored = normalizeAppProfile(sessionStorage.getItem("ceo_app_profile"));
        } catch {
          stored = null;
        }
        const nextProfile =
          appProfile ||
          stored ||
          normalizeAppProfile(data.app_profile) ||
          null;
        setLiveProfile(nextProfile);
        if (nextProfile) {
          try {
            sessionStorage.setItem("ceo_app_profile", nextProfile);
          } catch {
            /* private mode */
          }
        }
        const filtered = applyNavVisibility(data, nextProfile);
        const next = filtered?.menus || [];
        setMenus(next);
        sessionStorage.setItem(
          key,
          JSON.stringify({ at: Date.now(), menus: next })
        );
      })
      .catch(() => setMenus((prev) => prev));
  }, [appProfile]);

  const enabled = menus.filter((m) => m.enabled);
  const isStaff = enabled.some((m) => m.group === "staff");
  const primaryIds = isWarrantyProfile(liveProfile || appProfile)
    ? WARRANTY_IDS
    : isStaff
      ? STAFF_IDS
      : RESIDENT_IDS;
  const primary = primaryIds
    .map((id) => enabled.find((m) => m.id === id))
    .filter((m): m is MenuItem => Boolean(m));
  const tabPaths = new Set(
    community
      ? ["/account", ...COMMUNITY_TABS.map((tab) => tab.path)]
      : ["/account", ...primary.map((m) => m.path)]
  );

  const warranty = variant === "warranty";
  const moreItems =
    warranty && getBuildAppProfile() !== "operations"
      ? []
      : warranty
        ? enabled.filter((m) => !m.path.startsWith("/account/warranties"))
        : community
          ? communityMoreItems(
              enabled.filter((m) => !tabPaths.has(m.path))
            )
          : enabled.filter((m) => !tabPaths.has(m.path));

  const tabs = warranty
    ? WARRANTY_TABS
    : community
      ? COMMUNITY_TABS
      : [
          { id: "home", label: "Home", path: "/account" },
          ...primary.map((m) => ({
            id: m.id,
            label: tabLabel(m),
            path: menuHref(m),
          })),
        ];

  async function logout() {
    clearBrowserTokens();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const ui = (
    <>
      <nav
        className={`ceo-bottom-nav${
          community ? " ceo-ops-nav" : warranty ? " ceo-warranty-nav" : ""
        }`}
        aria-label="Primary"
        style={{ ["--nav-cols" as string]: String(tabs.length + 1) }}
      >
        {tabs.map((tab) => {
          /* A module landing page is a prefix of every screen beneath it, so it
             has to match exactly or it would light up on all of them. */
          const exact =
            tab.path === "/account" || tab.path === "/account/warranties";
          const active = exact
            ? pathname === tab.path
            : pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.id}
              href={tab.path}
              prefetch={false}
              className={active ? "is-active" : ""}
            >
              {community ? (
                <CommunityIcon id={tab.id} />
              ) : (
                <Icon id={tab.id} outline={warranty && !active} />
              )}
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          className={moreOpen ? "is-active" : ""}
          onClick={() => setMoreOpen(true)}
        >
          {community ? <CommunityIcon id="more_grid" /> : <Icon id="more" />}
          More
        </button>
      </nav>

      {moreOpen ? (
        <MoreSheet onClose={() => setMoreOpen(false)}>
            <p className="mb-3 text-sm font-semibold">More</p>
            <ul className="space-y-2">
              {warranty ? (
                <>
                  {getBuildAppProfile() === "operations" ? (
                    <li>
                      <Link
                        href="/account"
                        className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold"
                        onClick={() => setMoreOpen(false)}
                      >
                        Back to Operations
                        <span aria-hidden>→</span>
                      </Link>
                    </li>
                  ) : null}
                  <li>
                    <Link
                      href="/account/warranties/claims?filters=1"
                      className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold"
                      onClick={() => setMoreOpen(false)}
                    >
                      Search & Filters
                      <span aria-hidden>→</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/account/warranties/reports"
                      className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold"
                      onClick={() => setMoreOpen(false)}
                    >
                      Reports
                      <span aria-hidden>→</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/account/warranties/settings"
                      className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold"
                      onClick={() => setMoreOpen(false)}
                    >
                      Warranty Settings
                      <span aria-hidden>→</span>
                    </Link>
                  </li>
                </>
              ) : null}
              {moreItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={menuHref(item)}
                    className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold"
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                    <span aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-[var(--muted)]"
              onClick={logout}
            >
              Log out
            </button>
            <button
              type="button"
              className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold"
              onClick={() => setMoreOpen(false)}
            >
              Close
            </button>
        </MoreSheet>
      ) : null}
    </>
  );

  if (docked && typeof document !== "undefined") {
    return createPortal(ui, document.body);
  }
  return ui;
}
