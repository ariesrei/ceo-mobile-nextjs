"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  getClientLogo,
  getClientName,
  saveConnectConfig,
  getConnectConfig,
} from "@/lib/connect";
import { useClientBrand } from "./ClientBrandProvider";
import { Button } from "./ui/Button";

function isRealClientName(value?: string | null): value is string {
  const name = (value || "").trim();
  return Boolean(name) && name !== "Client";
}

export function AppShell({
  title,
  subtitle,
  children,
  backHref,
  clientName: clientNameProp,
  clientLogo: clientLogoProp,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  /** Server-provided client/site name when available. */
  clientName?: string;
  /** Server-provided custom logo URL when available. */
  clientLogo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const showLogout = pathname.startsWith("/account");
  const brand = useClientBrand();

  const [clientName, setClientName] = useState(() => {
    if (isRealClientName(clientNameProp)) return clientNameProp.trim();
    if (isRealClientName(brand.name)) return brand.name.trim();
    if (typeof window !== "undefined") {
      const stored = getClientName();
      if (isRealClientName(stored)) return stored;
    }
    return "Client";
  });
  const [clientLogo, setClientLogo] = useState(() => {
    if (clientLogoProp?.trim()) return clientLogoProp.trim();
    if (brand.logo?.trim()) return brand.logo.trim();
    if (typeof window !== "undefined") return getClientLogo();
    return "";
  });

  useEffect(() => {
    const fromPropName = isRealClientName(clientNameProp)
      ? clientNameProp.trim()
      : "";
    const fromBrandName = isRealClientName(brand.name) ? brand.name.trim() : "";
    const fromStorageName = getClientName();
    const resolvedName =
      fromPropName ||
      fromBrandName ||
      (isRealClientName(fromStorageName) ? fromStorageName : "") ||
      "Client";
    setClientName(resolvedName);

    const fromPropLogo = clientLogoProp?.trim() || "";
    const fromBrandLogo = brand.logo?.trim() || "";
    const fromStorageLogo = getClientLogo();
    const resolvedLogo = fromPropLogo || fromBrandLogo || fromStorageLogo;
    setClientLogo(resolvedLogo);

    if (!fromPropName && !fromBrandName) return;

    const cfg = getConnectConfig();
    if (cfg?.baseUrl) {
      saveConnectConfig(
        cfg.baseUrl,
        resolvedName !== "Client" ? resolvedName : cfg.clientName,
        resolvedLogo || cfg.clientLogo
      );
    }
  }, [clientNameProp, clientLogoProp, brand.name, brand.logo]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-10 pt-6">
      <header className="mb-6">
        {(backHref || showLogout) && (
          <div className="mb-4 flex items-center justify-between gap-3">
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex min-h-12 items-center rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-base font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)]"
              >
                ← Back
              </Link>
            ) : (
              <span />
            )}
            {showLogout ? (
              <Button
                variant="ghost"
                type="button"
                onClick={logout}
                className="min-h-12 shrink-0 border border-[var(--border)] bg-white px-5 py-3 text-base"
              >
                Log out
              </Button>
            ) : (
              <span />
            )}
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          {clientLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clientLogo}
              alt={clientName !== "Client" ? clientName : "Property logo"}
              className="mx-auto h-12 w-auto max-w-[200px] object-contain"
            />
          ) : (
            <p className="truncate text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              {clientName}
            </p>
          )}
          <h1 className="font-display mt-3 text-3xl tracking-tight text-[var(--ink)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
          ) : null}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
