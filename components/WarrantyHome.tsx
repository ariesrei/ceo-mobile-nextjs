"use client";

import { useEffect, useState } from "react";
import { getBuildAppProfile, setWarrantyChromeCookie } from "@/lib/app-profile";
import {
  emptyWarrantySummary,
  loadWarrantySummary,
} from "@/lib/helpers/warranties";
import { useWarrantyStaff } from "@/hooks/useWarrantyStaff";
import type { WarrantySummary } from "@/lib/warranties";
import { BottomNav } from "./BottomNav";
import { FastLink } from "./FastLink";
import { splitPropertyName, useWarrantyBrand } from "./WarrantyBrand";
import {
  ArrowLeftIcon,
  BuildingIcon,
  ClipboardIcon,
  ClockIcon,
  FilterIcon,
  PlusIcon,
  UsersIcon,
} from "./ui/Icons";

const CACHE_KEY = "ceo_warranty_home_v3";
const CACHE_MS = 60_000;

function greetingLabel(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

const EMPTY_STATS: WarrantySummary = {
  open: 0,
  in_progress: 0,
  closed: 0,
  assigned: 0,
  expiring: 0,
};

function readCache(): { at: number; stats: WarrantySummary } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; stats: WarrantySummary };
    if (!parsed?.at || Date.now() - parsed.at > CACHE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function WarrantyHome({ isStaff = false }: { isStaff?: boolean }) {
  const brand = useWarrantyBrand();
  const staff = useWarrantyStaff(isStaff);
  const [stats, setStats] = useState<WarrantySummary>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good morning,");

  useEffect(() => {
    setGreeting(greetingLabel());
    setWarrantyChromeCookie(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const warm = readCache();
    if (warm) {
      setStats(warm.stats);
      setLoading(false);
    }
    loadWarrantySummary()
      .then((next) => {
        if (cancelled) return;
        setStats(next);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), stats: next }));
      })
      .catch(() => {
        if (!cancelled && !warm) setStats(emptyWarrantySummary());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const name = (brand.firstName || "").trim() || "there";
  const property = splitPropertyName(brand.name);
  const fromOperations = getBuildAppProfile() === "operations";

  return (
    <div className="ceo-app ceo-warranty ceo-warranty-home ceo-warranty--with-nav mx-auto min-h-dvh w-full">
      <section
        className={`ceo-warranty-hero${
          brand.hero ? "" : " ceo-warranty-hero--flat"
        }`}
      >
        {brand.hero ? (
          <div
            className="ceo-warranty-hero__photo"
            style={{ backgroundImage: `url(${brand.hero})` }}
            aria-hidden
          />
        ) : null}
        <div className="ceo-warranty-hero__shade" aria-hidden />

        <header className="ceo-warranty-hero__bar">
          <div className="flex min-w-0 items-center gap-2.5">
            {fromOperations ? (
              <FastLink
                href="/account"
                prefetch={false}
                className="ceo-warranty-hero__back"
                aria-label="Back to Operations"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </FastLink>
            ) : null}
            {brand.logo ? (
              <span className="ceo-brand-avatar ceo-brand-avatar--hero">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brand.logo} alt="" />
              </span>
            ) : (
              <span className="ceo-warranty-hero__mark" aria-hidden>
                <BuildingIcon className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0 leading-tight">
              <p className="ceo-warranty-hero__property">{property.primary}</p>
              {property.secondary ? (
                <p className="ceo-warranty-hero__property-sub">{property.secondary}</p>
              ) : null}
            </div>
          </div>
        </header>

        <div className="ceo-warranty-hero__greeting">
          <p className="ceo-warranty-hero__hello">{greeting}</p>
          <p className="ceo-warranty-hero__name">{name}</p>
        </div>
      </section>

      <div className="ceo-warranty-sheet">
        {loading ? (
          <div
            className="ceo-warranty-home-skel"
            role="status"
            aria-label="Loading warranty home"
          >
            <div className="ceo-skel h-[124px] rounded-[1.25rem]" />
            <div className="ceo-skel h-[52px] rounded-[1.15rem]" />
            <div className="ceo-skel h-[58px] rounded-2xl" />
            <div className="ceo-skel h-[58px] rounded-2xl" />
            <div className="ceo-skel h-[58px] rounded-2xl" />
          </div>
        ) : (
          <>
            <section className="ceo-warranty-overview">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Warranty Overview</p>
              </div>
              <div className="ceo-warranty-stats">
                <FastLink
                  href="/account/warranties/claims?tab=open"
                  prefetch={false}
                  className="ceo-warranty-stat"
                >
                  <span className="ceo-warranty-stat__n">{stats.open}</span>
                  <span className="ceo-warranty-stat__l">Open</span>
                </FastLink>
                <FastLink
                  href="/account/warranties/claims?tab=progress"
                  prefetch={false}
                  className="ceo-warranty-stat"
                >
                  <span className="ceo-warranty-stat__n">{stats.in_progress}</span>
                  <span className="ceo-warranty-stat__l">In Progress</span>
                </FastLink>
                <FastLink
                  href="/account/warranties/claims?tab=closed"
                  prefetch={false}
                  className="ceo-warranty-stat"
                >
                  <span className="ceo-warranty-stat__n">{stats.closed}</span>
                  <span className="ceo-warranty-stat__l">Closed</span>
                </FastLink>
              </div>
            </section>

            <FastLink href="/account/warranties/new" prefetch={false} className="ceo-warranty-new">
              <PlusIcon className="h-4 w-4" />
              New Claim
            </FastLink>

            <nav className="ceo-warranty-menu ceo-warranty-menu--home">
              <FastLink
                href="/account/warranties/claims"
                prefetch={false}
                className="ceo-warranty-menu__row"
              >
                <span className="ceo-warranty-menu__icon">
                  <ClipboardIcon className="h-[18px] w-[18px]" />
                </span>
                <span className="ceo-warranty-menu__label">My Claims</span>
              </FastLink>
              {staff ? (
                <FastLink
                  href="/account/warranties/claims?tab=assigned"
                  prefetch={false}
                  className="ceo-warranty-menu__row"
                >
                  <span className="ceo-warranty-menu__icon">
                    <UsersIcon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="ceo-warranty-menu__label">Assigned to Subs</span>
                </FastLink>
              ) : null}
              {staff ? (
                <FastLink
                  href="/account/warranties/claims?tab=expiring"
                  prefetch={false}
                  className="ceo-warranty-menu__row"
                >
                  <span className="ceo-warranty-menu__icon">
                    <ClockIcon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="ceo-warranty-menu__label">Expiring Warranties</span>
                </FastLink>
              ) : null}
              <FastLink
                href="/account/warranties/claims?filters=1"
                prefetch={false}
                className="ceo-warranty-menu__row"
              >
                <span className="ceo-warranty-menu__icon">
                  <FilterIcon className="h-[18px] w-[18px]" />
                </span>
                <span className="ceo-warranty-menu__label">Search & Filters</span>
              </FastLink>
            </nav>
          </>
        )}
      </div>

      <BottomNav variant="warranty" />
    </div>
  );
}
