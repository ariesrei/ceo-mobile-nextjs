"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appVariant } from "@/lib/brand";
import {
  isWarrantyProfile,
  type AppProfile,
} from "@/lib/app-profile";
import { applyNavVisibility } from "@/lib/navigation";
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
  messaging:
    "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H8l-3.2 3.2A.8.8 0 0 1 3.5 18.6V5.5Z",
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

const STAFF_IDS = ["parcels", "warranties", "maintenance"];
const RESIDENT_IDS = ["profile", "parcels"];
const WARRANTY_IDS = ["warranties"];

function tabLabel(item: MenuItem): string {
  if (item.id === "warranties") return "Warranty";
  if (item.id === "profile") return "Profile";
  if (item.id === "edit_profile") return "Edit Profile";
  return item.label.replace(/^My /, "");
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
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);

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
        const filtered = applyNavVisibility(data, appProfile);
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
  const primaryIds = isWarrantyProfile(appProfile)
    ? WARRANTY_IDS
    : isStaff
      ? STAFF_IDS
      : RESIDENT_IDS;
  const primary = primaryIds
    .map((id) => enabled.find((m) => m.id === id))
    .filter((m): m is MenuItem => Boolean(m));
  const primaryPaths = new Set(["/account", ...primary.map((m) => m.path)]);

  const warranty = variant === "warranty";
  const moreItems =
    warranty && appVariant() === "warranty"
      ? []
      : warranty
        ? enabled.filter((m) => !m.path.startsWith("/account/warranties"))
        : enabled.filter((m) => !primaryPaths.has(m.path));

  const tabs = warranty
    ? WARRANTY_TABS
    : [
        { id: "home", label: "Home", path: "/account" },
        ...primary.map((m) => ({
          id: m.id,
          label: tabLabel(m),
          path: m.path,
        })),
      ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <nav
        className="ceo-bottom-nav"
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
              <Icon id={tab.id} outline={warranty && !active} />
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          className={moreOpen ? "is-active" : ""}
          onClick={() => setMoreOpen(true)}
        >
          <Icon id="more" />
          More
        </button>
      </nav>

      {moreOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 md:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="ceo-sheet">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            <p className="mb-3 text-sm font-semibold">More</p>
            <ul className="space-y-2">
              {warranty ? (
                <>
                  {appVariant() === "operations" ? (
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
                    href={item.path}
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
          </div>
        </div>
      ) : null}
    </>
  );
}
