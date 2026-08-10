import Link from "next/link";
import type { MenuItem } from "@/lib/types";

export function AccountMenu({ menus }: { menus: MenuItem[] }) {
  const visible = menus.filter((m) => m.enabled);

  if (!visible.length) {
    return (
      <p className="text-sm text-[var(--muted)]">No menu items available.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {visible.map((item) => (
        <li key={item.id}>
          <Link
            href={item.path}
            className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
          >
            <span className="font-medium text-[var(--ink)]">{item.label}</span>
            <span className="text-[var(--muted)]" aria-hidden>
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
