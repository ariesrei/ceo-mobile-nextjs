"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getProfile } from "@/lib/helpers/profile";
import type { Profile } from "@/lib/types";
import { EditProfileForm } from "./EditProfileForm";
import { Button } from "./ui/Button";
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

export function ProfileBoard() {
  const [item, setItem] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

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
  const subtitle = [item.job_title, item.unit].filter(Boolean).join(" · ");

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
  ] as const;
  const hasCompany = companyFields.some(([, value]) => Boolean(value?.trim()));

  const extraFields = [
    ["Unit", item.unit],
    ["Birthday", item.birthday],
    ["Membership type", item.membership_type],
    ["Membership ID", item.membership_id],
  ] as const;
  const hasExtra = extraFields.some(([, value]) => Boolean(value?.trim()));

  return (
    <div className="ceo-profile">
      {editing ? null : (
        <div className="ceo-profile__hero">
          <div className="ceo-profile__avatar">
            {item.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.avatar} alt="" />
            ) : (
              <span aria-hidden>{initial}</span>
            )}
          </div>
          <b>{item.full_name || "Profile"}</b>
          {subtitle ? <em>{subtitle}</em> : null}
        </div>
      )}

      <div className="ceo-vendor-tab-head">
        <p className="ceo-section-label">Profile</p>
        {editing ? (
          <Button
            type="button"
            variant="ghost"
            className="!px-3 !py-2 text-xs"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        ) : (
          <Button
            type="button"
            className="!px-3 !py-2 text-xs"
            onClick={() => setEditing(true)}
          >
            Edit profile
          </Button>
        )}
      </div>

      {editing ? (
        <EditProfileForm
          profile={item}
          onSaved={async () => {
            const data = await getProfile();
            if (data.ok) setItem(data.item);
            setEditing(false);
          }}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
