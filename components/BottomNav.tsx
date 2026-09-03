"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  more: "M5 12.5A1.5 1.5 0 1 1 5 9.5a1.5 1.5 0 0 1 0 3Zm7 0A1.5 1.5 0 1 1 12 9.5a1.5 1.5 0 0 1 0 3Zm7 0A1.5 1.5 0 1 1 19 9.5a1.5 1.5 0 0 1 0 3Z",
};

function Icon({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d={ICONS[id] || ICONS.more} />
    </svg>
  );
}

const STAFF_IDS = ["parcels", "warranties", "maintenance"];
const RESIDENT_IDS = ["profile", "edit_profile", "reservations", "parcels"];

function tabLabel(item: MenuItem): string {
  if (item.id === "warranties") return "Warranty";
  if (item.id === "profile") return "Profile";
  if (item.id === "edit_profile") return "Edit Profile";
  return item.label.replace(/^My /, "");
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    fetch("/api/wp/navigation")
      .then((r) => r.json())
      .then((data: NavigationResponse) => setMenus(data.menus || []))
      .catch(() => setMenus([]));
  }, []);

  const enabled = menus.filter((m) => m.enabled);
  const isStaff = enabled.some((m) => m.group === "staff");
  const primaryIds = isStaff ? STAFF_IDS : RESIDENT_IDS;
  const primary = primaryIds
    .map((id) => enabled.find((m) => m.id === id))
    .filter((m): m is MenuItem => Boolean(m));
  const primaryPaths = new Set(["/account", ...primary.map((m) => m.path)]);
  const moreItems = enabled.filter((m) => !primaryPaths.has(m.path));

  const tabs = [
    { id: "home", label: "Home", path: "/account" },
    ...primary.map((m) => ({
      id: m.id,
      label: tabLabel(m),
      path: m.path,
    })),
    { id: "more", label: "More", path: "#more" },
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
        style={{ ["--nav-cols" as string]: String(Math.max(tabs.length, 1)) }}
      >
        {tabs.map((tab) => {
          if (tab.id === "more") {
            return (
              <button
                key={tab.id}
                type="button"
                className={moreOpen ? "is-active" : ""}
                onClick={() => setMoreOpen(true)}
              >
                <Icon id="more" />
                More
              </button>
            );
          }
          const active =
            tab.path === "/account"
              ? pathname === "/account"
              : pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={active ? "is-active" : ""}
            >
              <Icon id={tab.id} />
              {tab.label}
            </Link>
          );
        })}
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
