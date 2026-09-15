"use client";

import { useEffect, useState } from "react";
import { isWarrantyProfile, type AppProfile } from "@/lib/app-profile";
import type { MenuItem } from "@/lib/types";
import { AccountMenu } from "./AccountMenu";
import { BottomNav } from "./BottomNav";

const RESIDENT_HOME_IDS = [
  "profile",
  "edit_profile",
  "additional_info",
  "reservations",
  "parcels",
  "warranties",
];

const WARRANTY_HOME_IDS = ["warranties", "profile", "edit_profile"];

function homeMenus(menus: MenuItem[], profile?: AppProfile | null): MenuItem[] {
  const enabled = menus.filter((m) => m.enabled);
  if (isWarrantyProfile(profile)) {
    const preferred = WARRANTY_HOME_IDS.map((id) =>
      enabled.find((m) => m.id === id)
    ).filter((m): m is MenuItem => Boolean(m));
    return preferred.length ? preferred : enabled;
  }
  const isStaff = enabled.some((m) => m.group === "staff");
  if (isStaff) return enabled;
  return RESIDENT_HOME_IDS.map((id) => enabled.find((m) => m.id === id)).filter(
    (m): m is MenuItem => Boolean(m)
  );
}

function splitPropertyName(name: string): { primary: string; secondary: string } {
  const trimmed = name.trim();
  if (!trimmed || trimmed === "Client") {
    return { primary: "YOUR PROPERTY", secondary: "" };
  }
  const atMatch = trimmed.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    return {
      primary: atMatch[1].toUpperCase(),
      secondary: `AT ${atMatch[2].toUpperCase()}`,
    };
  }
  return { primary: trimmed.toUpperCase(), secondary: "" };
}

function greetingLabel(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

function firstNameFrom(displayName?: string, firstName?: string): string {
  const first = (firstName || "").trim();
  if (first) return first;
  const parts = (displayName || "").trim().split(/\s+/);
  return parts[0] || "there";
}

export function HomeScreen({
  menus,
  clientName,
  clientLogo,
  clientHero,
  displayName,
  firstName,
  appProfile,
}: {
  menus: MenuItem[];
  clientName: string;
  clientLogo?: string;
  clientHero?: string;
  displayName?: string;
  firstName?: string;
  appProfile?: AppProfile | null;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [greeting, setGreeting] = useState("Good morning,");
  const brand = splitPropertyName(clientName);
  const name = firstNameFrom(displayName, firstName);

  useEffect(() => {
    setGreeting(greetingLabel());
  }, []);

  useEffect(() => {
    if (name && name !== "there") {
      try {
        sessionStorage.setItem("ceo_first_name", name);
      } catch {
        /* private mode */
      }
    }
  }, [name]);

  return (
    <div className="ceo-home ceo-app mx-auto min-h-dvh w-full pb-24">
      <section className="ceo-home-hero relative overflow-hidden">
        {/* Separate layer rather than a background on the section itself: an
            inline background-image would replace the fallback gradient, so a
            property with no photo — or an unreachable one — would paint flat. */}
        {clientHero ? (
          <div
            className="ceo-home-hero__photo"
            style={{ backgroundImage: `url(${clientHero})` }}
            aria-hidden
          />
        ) : null}
        <div className="ceo-home-hero__shade" aria-hidden />
        <header className="relative z-10 flex items-start justify-between px-5 pt-5 md:px-8 md:pt-7">
          <div className="flex min-w-0 items-center gap-3">
            {clientLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clientLogo}
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg object-contain"
              />
            ) : (
              <span className="ceo-home-mark" aria-hidden>
                <svg viewBox="0 0 32 32" className="h-9 w-9">
                  <path
                    d="M6 26V12l5-3 5 3v14M16 26V9l5-3 5 3v17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
            <div className="min-w-0 text-left leading-tight">
              <p className="truncate text-[15px] font-semibold tracking-[0.14em] text-white">
                {brand.primary}
              </p>
              {brand.secondary ? (
                <p className="truncate text-[11px] font-medium tracking-[0.16em] text-white/80">
                  {brand.secondary}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="ceo-home-bell"
            aria-label="Notifications"
            onClick={() => setShowNotes(true)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <path
                d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M10 18.5a2 2 0 0 0 4 0"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="relative z-10 flex flex-1 flex-col justify-end px-5 pb-16 pt-20 md:px-8 md:pb-20 md:pt-24">
          <p className="text-[20px] font-normal text-white/90 md:text-[24px]">{greeting}</p>
          <p className="mt-1 text-[34px] font-semibold leading-none tracking-tight text-white md:text-[48px]">
            {name} <span aria-hidden>👋</span>
          </p>
        </div>
      </section>

      <section className="ceo-home-sheet relative z-20 -mt-8 px-4 pb-8 md:px-6">
        <div className="rounded-t-[28px] bg-[var(--bg)] px-3 pb-6 pt-5 md:px-5 md:pt-6">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />
          <AccountMenu menus={homeMenus(menus, appProfile)} variant="home" />
        </div>
      </section>
      <BottomNav
        appProfile={appProfile}
        variant={isWarrantyProfile(appProfile) ? "warranty" : "app"}
      />

      {showNotes ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ceo-home-notes-title"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-[var(--surface)] p-5">
            <h2 id="ceo-home-notes-title" className="text-lg font-semibold">
              Notifications
            </h2>
            <p className="text-sm text-[var(--muted)]">
              You have no new notifications.
            </p>
            <button
              type="button"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-3 text-sm font-semibold"
              onClick={() => setShowNotes(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
