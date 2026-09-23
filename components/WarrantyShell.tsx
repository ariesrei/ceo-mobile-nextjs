"use client";

import { ReactNode, useEffect } from "react";
import { setWarrantyChromeCookie } from "@/lib/app-profile";
import { BottomNav } from "./BottomNav";
import { FastLink } from "./FastLink";
import { useWarrantyBrand } from "./WarrantyBrand";
import { ArrowLeftIcon, CloseIcon } from "./ui/Icons";

export function WarrantyShell({
  title,
  subtitle,
  backHref,
  /** Renders an X instead of a back arrow, for the modal-style screens. */
  dismiss = false,
  action,
  children,
  showNav = true,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  dismiss?: boolean;
  action?: ReactNode;
  children: ReactNode;
  showNav?: boolean;
}) {
  const brand = useWarrantyBrand();

  useEffect(() => {
    setWarrantyChromeCookie(true);
  }, []);

  return (
    <div
      className={`ceo-app ceo-warranty mx-auto min-h-dvh w-full${
        showNav ? " ceo-warranty--with-nav" : ""
      }`}
    >
      <header
        className={`ceo-warranty-topbar${
          brand.hero ? "" : " ceo-warranty-topbar--flat"
        }`}
      >
        {brand.hero ? (
          <div
            className="ceo-warranty-topbar__photo"
            style={{ backgroundImage: `url(${brand.hero})` }}
            aria-hidden
          />
        ) : null}
        <div className="ceo-warranty-topbar__shade" aria-hidden />
        <div className="ceo-warranty-topbar__row">
          {backHref ? (
            <FastLink
              href={backHref}
              className="ceo-warranty-iconbtn"
              aria-label={dismiss ? "Close" : "Back"}
            >
              {dismiss ? (
                <CloseIcon className="h-5 w-5" />
              ) : (
                <ArrowLeftIcon className="h-5 w-5" />
              )}
            </FastLink>
          ) : (
            <span className="ceo-warranty-iconbtn ceo-warranty-iconbtn--empty" />
          )}

          <div className="ceo-warranty-topbar__title">
            <p className="ceo-warranty-topbar__name">{title}</p>
            {subtitle ? (
              <p className="ceo-warranty-topbar__sub">{subtitle}</p>
            ) : null}
          </div>

          <div className="ceo-warranty-topbar__action">
            {action ??
              (brand.logo ? (
                <span className="ceo-brand-avatar ceo-brand-avatar--topbar">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brand.logo} alt={brand.name} />
                </span>
              ) : (
                <span className="ceo-warranty-iconbtn ceo-warranty-iconbtn--empty" />
              ))}
          </div>
        </div>
      </header>

      <main className="ceo-warranty__body">{children}</main>
      {showNav ? <BottomNav variant="warranty" /> : null}
    </div>
  );
}
