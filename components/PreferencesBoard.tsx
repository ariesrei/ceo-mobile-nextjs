"use client";

import { useEffect, useState } from "react";
import {
  cadenceLabel,
  COMMUNITY_OPTIONS,
  EVENTS_OPTIONS,
  getPrefs,
  PARCELS_OPTIONS,
  savePrefs,
  type AppPrefs,
} from "@/lib/helpers/prefs";
import { EmptyState, ListSkeleton } from "./ui/ListState";
import { useHeldLoading } from "./ui/useLoadMore";

type PickerKey = "community" | "events" | "parcels";

const PICKERS: Record<
  PickerKey,
  { title: string; options: { id: string; label: string }[] }
> = {
  community: { title: "Community Updates", options: COMMUNITY_OPTIONS },
  events: { title: "Event Reminders", options: EVENTS_OPTIONS },
  parcels: { title: "Package Alerts", options: PARCELS_OPTIONS },
};

function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="ceo-pref-toggle"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
    >
      <span>{label}</span>
      <i className={`ceo-toggle${on ? " is-on" : ""}`} aria-hidden>
        <span />
      </i>
    </button>
  );
}

export function PreferencesBoard() {
  const [prefs, setPrefs] = useState<AppPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [picker, setPicker] = useState<PickerKey | null>(null);

  useEffect(() => {
    getPrefs()
      .then((data) => {
        if (data.ok) setPrefs(data.item);
      })
      .finally(() => setLoading(false));
  }, []);

  async function patch(partial: Partial<AppPrefs>) {
    if (!prefs) return;
    const prev = prefs;
    setPrefs({ ...prefs, ...partial });
    const res = await savePrefs(partial);
    if (!res.ok) setPrefs(prev);
    else setPrefs(res.item);
  }

  if (pending) return <ListSkeleton rows={6} height={64} />;
  if (!prefs) {
    return (
      <EmptyState subtitle="Try again in a moment.">
        Preferences unavailable
      </EmptyState>
    );
  }

  const sheet = picker ? PICKERS[picker] : null;

  return (
    <div className="ceo-pref">
      <section>
        <h2>Notifications</h2>
        <Toggle
          label="Push Notifications"
          on={prefs.push}
          onClick={() => patch({ push: !prefs.push })}
        />
        <Toggle
          label="Email Notifications"
          on={prefs.email}
          onClick={() => patch({ email: !prefs.email })}
        />
        <Toggle
          label="SMS Notifications"
          on={prefs.sms}
          onClick={() => patch({ sms: !prefs.sms })}
        />
      </section>

      <section>
        <h2>Communication Preferences</h2>
        {(Object.keys(PICKERS) as PickerKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className="ceo-pref-row"
            onClick={() => setPicker(key)}
          >
            <span>
              <b>{PICKERS[key].title}</b>
              <small>{cadenceLabel(key, prefs[key])}</small>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </section>

      {sheet && picker ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 md:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={sheet.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPicker(null);
          }}
        >
          <div className="ceo-sheet">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            <p className="mb-3 text-sm font-semibold">{sheet.title}</p>
            <ul className="ceo-pref-choices">
              {sheet.options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className={prefs[picker] === option.id ? "is-on" : ""}
                    onClick={() => {
                      patch({ [picker]: option.id } as Partial<AppPrefs>);
                      setPicker(null);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold"
              onClick={() => setPicker(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
