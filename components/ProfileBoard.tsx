"use client";

import { useEffect, useState } from "react";
import { FastLink } from "./FastLink";
import { getProfile } from "@/lib/helpers/profile";
import type { Profile } from "@/lib/types";
import { EmptyState, ListSkeleton } from "./ui/ListState";

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="ceo-profile-field">
      <small>{label}</small>
      <p>{value}</p>
    </div>
  );
}

export function ProfileBoard() {
  const [item, setItem] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then((data) => {
        if (data.ok) setItem(data.item);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ListSkeleton rows={3} height={88} />;
  if (!item) {
    return (
      <EmptyState subtitle="Try again in a moment.">
        Profile unavailable
      </EmptyState>
    );
  }

  const email = item.ceo_email || item.email;
  const phone = item.phone || item.mobile;
  const initial = (item.first_name || item.full_name || "U").slice(0, 1).toUpperCase();

  return (
    <div className="ceo-profile">
      <div className="ceo-profile__hero">
        <div className="ceo-profile__avatar">
          {item.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.avatar} alt="" />
          ) : (
            <span aria-hidden>{initial}</span>
          )}
          <FastLink href="/account/edit" className="ceo-profile__edit" aria-label="Edit profile">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path
                d="M4 17.5V20h2.5l8.4-8.4-2.5-2.5L4 17.5Zm13.7-8.2a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-1.2 1.2 2.5 2.5 1.7-1.7Z"
                fill="currentColor"
              />
            </svg>
          </FastLink>
        </div>
        <b>{item.full_name || "Resident"}</b>
        {item.unit ? <em>{item.unit}</em> : null}
      </div>

      <section className="ceo-profile__card">
        <h2>Contact Information</h2>
        <Field label="Email" value={email} />
        <Field label="Phone" value={phone} />
        <Field label="Address" value={item.address} />
      </section>
    </div>
  );
}
