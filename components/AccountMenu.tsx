import Link from "next/link";
import type { MenuItem } from "@/lib/types";

const ICONS: Record<string, string> = {
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
  messaging:
    "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H8l-3.2 3.2A.8.8 0 0 1 3.5 18.6V5.5Z",
};

const HOME_LABELS: Record<string, string> = {
  profile: "Profile",
  edit_profile: "Edit Profile",
  additional_info: "Additional Info",
  warranties: "Warranty Claim",
};

function homeLabel(item: MenuItem): string {
  return HOME_LABELS[item.id] || item.label.replace(/^My /, "");
}

function MenuIcon({ id }: { id: string }) {
  const d = ICONS[id] || ICONS.additional_info;
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function AccountMenu({
  menus,
  variant = "list",
}: {
  menus: MenuItem[];
  variant?: "list" | "home";
}) {
  const visible = menus.filter((m) => m.enabled);

  if (!visible.length) {
    return (
      <p className="text-sm text-[var(--muted)]">No menu items available.</p>
    );
  }

  if (variant === "home") {
    return (
      <ul className="ceo-home-grid">
        {visible.map((item) => (
          <li key={item.id}>
            <Link href={item.path} prefetch={false} className="ceo-home-tile">
              <span className="ceo-home-tile__icon">
                <MenuIcon id={item.id} />
              </span>
              <span className="ceo-home-tile__label">{homeLabel(item)}</span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-2">
      {visible.map((item) => (
        <li key={item.id}>
          <Link
            href={item.path}
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
