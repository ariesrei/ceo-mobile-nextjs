"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import {
  getClientLogo,
  getClientName,
  saveConnectConfig,
  getConnectConfig,
} from "@/lib/connect";
import { useClientBrand } from "./ClientBrandProvider";
import { BottomNav } from "./BottomNav";

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
  showNav = true,
  narrow = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  clientName?: string;
  clientLogo?: string;
  showNav?: boolean;
  narrow?: boolean;
}) {
  const brand = useClientBrand();
  const [clientName, setClientName] = useState(() => {
    if (isRealClientName(clientNameProp)) return clientNameProp.trim();
    if (isRealClientName(brand.name)) return brand.name.trim();
    return "Client";
  });
  const [clientLogo, setClientLogo] = useState(() => {
    if (clientLogoProp?.trim()) return clientLogoProp.trim();
    if (brand.logo?.trim()) return brand.logo.trim();
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
    const resolvedLogo = fromPropLogo || fromBrandLogo || getClientLogo();
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

  return (
    <div
      className={`ceo-app mx-auto min-h-dvh w-full px-[var(--app-pad)] pb-28 pt-5${
        narrow ? " ceo-app--narrow" : ""
      }`}
    >
      <header className="mb-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-lg text-[var(--ink)]"
              aria-label="Back"
            >
              ←
            </Link>
          ) : (
            <span />
          )}
          {clientLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clientLogo}
              alt={clientName}
              className="h-7 w-auto max-w-[120px] object-contain"
            />
          ) : (
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {clientName}
            </span>
          )}
        </div>
        {title ? (
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--ink)] md:text-[34px]">
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        ) : null}
      </header>
      <main>{children}</main>
      {showNav ? <BottomNav /> : null}
    </div>
  );
}
