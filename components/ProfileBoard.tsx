"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FastLink } from "./FastLink";
import { getProfile } from "@/lib/helpers/profile";
import type { Profile } from "@/lib/types";
import { EmptyState, ListSkeleton } from "./ui/ListState";

function Field({ label, value }: { label: string; value?: string }) {
  const text = (value || "").trim();
  if (!text) return null;
  return (
    <div className="ceo-profile-field">
      <small>{label}</small>
      <p>{text}</p>
    </div>
  );
}

function onOff(on?: boolean) {
  return on ? "On" : "Off";
}

function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ceo-profile__card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function ProfileBoard({
  editHref = "/account/edit",
}: {
  editHref?: string;
}) {
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
  const initial = (item.first_name || item.full_name || "U").slice(0, 1).toUpperCase();
  const subtitle = [
    item.contact_type,
    item.job_title,
    item.unit,
    item.contact_status,
  ]
    .filter(Boolean)
    .join(" · ");

  const contactFields = [
    ["Salutation", item.salutation],
    ["First name", item.first_name],
    ["Last name", item.last_name],
    ["Email", email],
    ["Phone", item.phone],
    ["Mobile", item.mobile],
    ["Website", item.website],
  ] as const;
  const hasContact = contactFields.some(([, value]) => Boolean(value?.trim()));

  const companyFields = [
    ["Company", item.company],
    ["Job title", item.job_title],
    ["Address", item.address],
    ["Company phone", item.company_phone],
    ["COI expiration", item.coi_expiration],
    ["Payment terms", item.payment_terms],
    ["Rating", item.rating],
  ] as const;
  const hasCompany = companyFields.some(([, value]) => Boolean(value?.trim()));

  const extraFields = [
    ["Unit", item.unit],
    ["Birthday", item.birthday],
    ["Emergency contact", item.emergency_contact],
    ["Allergies", item.allergies],
    ["Membership type", item.membership_type],
    ["Membership ID", item.membership_id],
    ["Contact type", item.contact_type],
    ["Contact status", item.contact_status],
  ] as const;
  const hasExtra = extraFields.some(([, value]) => Boolean(value?.trim()));

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
          <FastLink href={editHref} className="ceo-profile__edit" aria-label="Edit profile">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path
                d="M4 17.5V20h2.5l8.4-8.4-2.5-2.5L4 17.5Zm13.7-8.2a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-1.2 1.2 2.5 2.5 1.7-1.7Z"
                fill="currentColor"
              />
            </svg>
          </FastLink>
        </div>
        <b>{item.full_name || "Profile"}</b>
        {subtitle ? <em>{subtitle}</em> : null}
      </div>

      {hasContact ? (
        <Card title="Contact information">
          {contactFields.map(([label, value]) => (
            <Field key={label} label={label} value={value} />
          ))}
        </Card>
      ) : null}

      {hasCompany ? (
        <Card title="Company">
          {companyFields.map(([label, value]) => (
            <Field key={label} label={label} value={value} />
          ))}
        </Card>
      ) : null}

      {hasExtra ? (
        <Card title="Additional information">
          {extraFields.map(([label, value]) => (
            <Field key={label} label={label} value={value} />
          ))}
        </Card>
      ) : null}

      <Card title="Notifications">
        <Field label="Email notification" value={onOff(item.opt_email)} />
        <Field label="SMS notification" value={onOff(item.opt_sms)} />
      </Card>
    </div>
  );
}
