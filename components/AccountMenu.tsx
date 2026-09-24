"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuHref } from "@/lib/navigation";
import type { MenuItem } from "@/lib/types";
import { ChevronRightIcon } from "./ui/Icons";
import { EmptyState } from "./ui/ListState";

const ICONS: Record<string, string> = {
  home: "M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z",
  profile: "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z",
  edit_profile:
    "M4 17.5V20h2.5l8.4-8.4-2.5-2.5L4 17.5Zm13.7-8.2a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-1.2 1.2 2.5 2.5 1.7-1.7Z",
  reservations:
    "M6 4h12a2 2 0 0 1 2 2v13l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2Zm1 5h10M7 13h6",
  additional_info:
    "M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm0 3.2a1.2 1.2 0 1 1-1.2 1.2A1.2 1.2 0 0 1 12 7.2ZM11 11h2v6h-2Z",
  history:
    "M12 5a7 7 0 1 1-7 7H3l3-3 3 3H7a5 5 0 1 0 5-5Zm-.8 3v4.2l3 1.8.8-1.3-2.3-1.4V8Z",
  warranties:
    "M12 3 5 6v6c0 5 3.2 8.4 7 9.6 3.8-1.2 7-4.6 7-9.6V6l-7-3Zm-1 12-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z",
  maintenance:
    "M14.7 6.3a4 4 0 0 1 3 3L15 12l3 3-1.4 1.4L12 12l-6.3 6.3L4.3 17 12 9.3l2.7-3Z",
  parcels:
    "M4 8.5 12 4l8 4.5v9L12 22 4 17.5v-9Zm8 4.5 8-4.5M12 13v9M4.2 8.6 12 13",
  guests:
    "M9 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9 11Zm8.5-1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 17.5 10ZM3 19c0-2.4 2.5-4 6-4s6 1.6 6 4v1H3Zm12.2 0c.3-1.6 1.6-2.7 3.3-3.4 1.5.6 2.5 1.7 2.5 3.4v1h-5.8Z",
  contacts:
    "M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8.5-1.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM2.8 19C2.8 16.4 5.2 15 8 15s5.2 1.4 5.2 4v1H2.8Zm12.5 0c.2-1.5 1.3-2.6 2.8-3.3 1.4.5 2.3 1.6 2.3 3.3v1h-5.1Z",
  activities:
    "M5 6h14v3H5V6Zm0 5h14v3H5v-3Zm0 5h9v3H5v-3Z",
  events:
    "M6 4h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2Zm1 5h10M7 13h6",
  announcements:
    "M4 9v6h3l5 3V6L7 9H4Zm14.2 1.2a4 4 0 0 1 0 3.6M16.2 8.6a6.2 6.2 0 0 1 0 6.8",
  classifieds:
    "M5 6h14v4H5V6Zm0 6h14v8H5v-8Zm3 3h5",
  documents:
    "M4 7.4A1.4 1.4 0 0 1 5.4 6h3.3l1.7 1.9h8.2A1.4 1.4 0 0 1 20 9.3v8.3a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 17.6V7.4Z",
  assets:
    "M12 4.5 4.8 8v8L12 19.5 19.2 16V8L12 4.5Zm0 4.2 4.4-2.1L12 6.4 7.6 8.6 12 8.7Zm0 1.6-4.8-2.3v6.3L12 16.8V10.3Z",
  preferences:
    "M12 8.4a3.6 3.6 0 1 0 3.6 3.6A3.6 3.6 0 0 0 12 8.4Zm8.4 2.8-1.8-.3a6.9 6.9 0 0 0-.6-1.5l1.2-1.4-1.7-1.7-1.4 1.1a6.9 6.9 0 0 0-1.5-.6l-.3-1.8h-2.6l-.3 1.8a6.9 6.9 0 0 0-1.5.6L8.5 6.3 6.8 8l1.1 1.4a6.9 6.9 0 0 0-.6 1.5l-1.8.3v2.6l1.8.3a6.9 6.9 0 0 0 .6 1.5L6.8 17l1.7 1.7 1.4-1.1a6.9 6.9 0 0 0 1.5.6l.3 1.8h2.6l.3-1.8a6.9 6.9 0 0 0 1.5-.6l1.4 1.1 1.7-1.7-1.2-1.4a6.9 6.9 0 0 0 .6-1.5l1.8-.3Z",
  messaging:
    "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H8l-3.2 3.2A.8.8 0 0 1 3.5 18.6V5.5Z",
};

const HOME_LABELS: Record<string, string> = {
  profile: "View Profile",
  edit_profile: "Edit Profile",
  additional_info: "Additional Info",
  warranties: "Warranty",
  guests: "Guests",
  parcels: "Parcels",
  maintenance: "Work Orders",
  contacts: "Contacts",
  activities: "Activities",
  events: "Events",
  announcements: "Announcements",
  classifieds: "Classifieds",
  documents: "My Documents",
  preferences: "My Preferences",
  history: "History",
  reservations: "Reservations",
  home: "Home",
};

const ACTION_LABELS: Record<string, string> = {
  maintenance: "Make a Request",
  reservations: "Reserve Amenity",
  additional_info: "View Documents",
  edit_profile: "Edit Profile",
  profile: "View Profile",
  contacts: "Contact Management",
  pay_balance: "Pay Balance",
};

function homeLabel(item: MenuItem): string {
  return HOME_LABELS[item.id] || item.label.replace(/^My /, "");
}

function actionLabel(item: MenuItem): string {
  return ACTION_LABELS[item.id] || item.label;
}

function MenuIcon({ id }: { id: string }) {
  const d = ICONS[id] || ICONS.additional_info;
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const SOON_IDS = new Set(["messaging", "pay_balance"]);

const ACTION_TONE: Record<string, string> = {
  home: "teal",
  maintenance: "teal",
  reservations: "green",
  parcels: "blue",
  guests: "orange",
  activities: "purple",
  messaging: "sky",
  contacts: "cyan",
  pay_balance: "green",
  profile: "orange",
  edit_profile: "orange",
  additional_info: "blue",
  events: "purple",
  announcements: "orange",
  documents: "cyan",
  assets: "blue",
  classifieds: "green",
  history: "sky",
};

function ActionIcon({ id }: { id: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden {...common}>
      {id === "maintenance" ? (
        <path d="M14.7 6.3a4 4 0 0 1 3.1 3.1L15 12l3 3-1.4 1.4L12 12 5.7 18.3 4.3 17 12 9.3l2.7-3Z" />
      ) : id === "reservations" ? (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 11h16" />
        </>
      ) : id === "additional_info" ? (
        <>
          <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5H11l2 2h5.5A1.5 1.5 0 0 1 20 8.5v10A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-12Z" />
          <path d="M8 13h8M8 16h5" />
        </>
      ) : id === "parcels" ? (
        <>
          <path d="M4 8.6 12 4l8 4.6v9.2L12 22 4 17.8V8.6Z" />
          <path d="M12 13 4.2 8.6M12 13l7.8-4.4M12 13v9" />
        </>
      ) : id === "contacts" ? (
        <>
          <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
          <rect x="3" y="13" width="4" height="6" rx="1.4" />
          <rect x="17" y="13" width="4" height="6" rx="1.4" />
          <path d="M19 19v1.2A2.8 2.8 0 0 1 16.2 23H12" />
        </>
      ) : id === "guests" || id === "profile" || id === "edit_profile" ? (
        <>
          <circle cx="12" cy="8" r="3.1" />
          <path d="M5.5 19.2c.6-3.1 3.2-5.2 6.5-5.2s5.9 2.1 6.5 5.2" />
        </>
      ) : id === "activities" ? (
        <>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 9h8M8 12h8M8 15h5" />
        </>
      ) : id === "messaging" ? (
        <path d="M5 6h14a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 19 16H9l-3.5 3v-3H5a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 5 6Z" />
      ) : id === "pay_balance" ? (
        <>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <path d="M3.5 10h17M8 15h3" />
        </>
      ) : (
        <path d="M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm0 4v4l3 2" />
      )}
    </svg>
  );
}

export function AccountMenu({
  menus,
  variant = "list",
}: {
  menus: MenuItem[];
  variant?: "list" | "home" | "actions" | "rail";
}) {
  const pathname = usePathname();
  const visible = menus.filter((m) => m.enabled);

  if (!visible.length) {
    return (
      <EmptyState icon="inbox" compact subtitle="Nothing else is available right now.">
        No more options
      </EmptyState>
    );
  }

  if (variant === "actions") {
    return (
      <nav className="ceo-ops-actions">
        {visible.map((item) => (
          <Link
            key={item.id}
            href={menuHref(item)}
            prefetch={false}
            className={`ceo-ops-action${SOON_IDS.has(item.id) ? " is-soon" : ""}`}
            data-tone={ACTION_TONE[item.id] || "teal"}
          >
            <span className="ceo-ops-action__icon">
              <ActionIcon id={item.id} />
            </span>
            <span className="ceo-ops-action__label">
              {actionLabel(item)}
              {SOON_IDS.has(item.id) ? <small>Under construction</small> : null}
            </span>
            <ChevronRightIcon className="ceo-ops-action__chev" />
          </Link>
        ))}
      </nav>
    );
  }

  if (variant === "rail") {
    return (
      <nav className="ceo-ops-rail__nav">
        {visible.map((item) => {
          const href = menuHref(item);
          const active =
            href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(href);
          return (
            <Link
              key={item.id}
              href={href}
              prefetch={false}
              className={`ceo-ops-rail__link${active ? " is-active" : ""}${
                SOON_IDS.has(item.id) ? " is-soon" : ""
              }`}
              data-tone={ACTION_TONE[item.id] || "teal"}
            >
              <span className="ceo-ops-rail__icon">
                <MenuIcon id={item.id} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  if (variant === "home") {
    return (
      <nav className="ceo-warranty-menu ceo-warranty-menu--home">
        {visible.map((item) => (
          <Link
            key={item.id}
            href={menuHref(item)}
            prefetch={false}
            className="ceo-warranty-menu__row"
          >
            <span className="ceo-warranty-menu__icon">
              <MenuIcon id={item.id} />
            </span>
            <span className="ceo-warranty-menu__label">{homeLabel(item)}</span>
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <ul className="space-y-2">
      {visible.map((item) => (
        <li key={item.id}>
          <Link
            href={menuHref(item)}
            prefetch={false}
            className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
          >
            <span className="flex items-center gap-3 font-medium text-[var(--ink)]">
              <span className="text-[var(--accent)]">
                <MenuIcon id={item.id} />
              </span>
              {item.label}
            </span>
            <span className="text-[var(--muted)]" aria-hidden>
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
