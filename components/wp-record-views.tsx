"use client";

import Link from "next/link";
import type { AdditionalSections, PetItem, PreferenceItem, VehicleItem } from "@/lib/additional-info";
import type { GuestItem } from "@/lib/guests";
import type { MaintenanceItem } from "@/lib/maintenance";
import type { ParcelItem } from "@/lib/parcels";
import type { Profile, ReservationItem } from "@/lib/types";
import type { WarrantyItem } from "@/lib/warranties";
import { AdditionalInfoLists } from "./AdditionalInfoLists";
import { EditProfileForm } from "./EditProfileForm";
import { GuestForm } from "./GuestForm";
import { HistoryLists } from "./HistoryLists";
import { MaintenanceForm } from "./MaintenanceForm";
import { ParcelForm } from "./ParcelForm";
import { PetForm } from "./PetForm";
import { PreferenceForm } from "./PreferenceForm";
import { ReservationList } from "./ReservationList";
import { VehicleForm } from "./VehicleForm";
import { WarrantyAssignForm } from "./WarrantyAssignForm";
import { WarrantyClaimDetail } from "./WarrantyClaimDetail";
import { WarrantyForm } from "./WarrantyForm";
import { WarrantyStatusForm } from "./WarrantyStatusForm";
import { Card } from "./ui/Card";

export function WarrantyClaimView({
  data,
  isStaff,
}: {
  data: WarrantyItem;
  isStaff: boolean;
}) {
  return (
    <WarrantyClaimDetail
      record={data}
      canEdit={Boolean(data.can_edit)}
      isStaff={isStaff}
    />
  );
}

export function WarrantyFormView({ data }: { data: WarrantyItem }) {
  return <WarrantyForm record={data} sectioned />;
}

export function WarrantyAssignView({ data }: { data: WarrantyItem }) {
  return <WarrantyAssignForm record={data} />;
}

export function WarrantyStatusView({ data }: { data: WarrantyItem }) {
  return <WarrantyStatusForm record={data} />;
}

function Row({ label, value }: { label: string; value?: string | boolean }) {
  if (value === undefined || value === "") return null;
  const text = typeof value === "boolean" ? (value ? "On" : "Off") : value;
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] py-3.5 last:border-0">
      <dt className="text-sm text-[var(--muted)]">{label}</dt>
      <dd className="text-right text-sm font-semibold text-[var(--ink)]">{text}</dd>
    </div>
  );
}

export function ProfileView({ data }: { data: Profile }) {
  const profile = data;
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center pt-2 text-center">
        <div className="relative">
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--surface)] text-2xl font-bold text-[var(--accent)]">
              {(profile.first_name || "?").slice(0, 1)}
            </div>
          )}
          <Link
            href="/account/edit"
            className="absolute -bottom-1 -right-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-extrabold text-[#081014]"
          >
            Edit
          </Link>
        </div>
        <p className="mt-4 text-xl font-bold">{profile.full_name}</p>
        <p className="text-sm text-[var(--muted)]">
          {[profile.contact_type, profile.membership_type, profile.contact_status]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="ceo-profile-grid">
        <Card>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Contact information
          </p>
          <dl>
            <Row label="Email" value={profile.ceo_email || profile.email} />
            <Row label="Phone" value={profile.phone} />
            <Row label="Mobile" value={profile.mobile} />
          </dl>
        </Card>

        <Card>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Details
          </p>
          <dl>
            <Row label="Company" value={profile.company} />
            <Row label="Job title" value={profile.job_title} />
            <Row label="Birthday" value={profile.birthday} />
            <Row label="Emergency" value={profile.emergency_contact} />
            <Row label="Email alerts" value={profile.opt_email} />
            <Row label="SMS alerts" value={profile.opt_sms} />
          </dl>
        </Card>
      </div>
    </div>
  );
}

export function EditProfileView({ data }: { data: Profile }) {
  return (
    <Card>
      <EditProfileForm profile={data} />
    </Card>
  );
}

export type HistoryResponse = {
  tabs: {
    guests?: {
      enabled: boolean;
      items: Array<{
        id: number;
        names: string;
        phone: string;
        check_in: string;
        check_out: string;
      }>;
    };
    reservations?: {
      enabled: boolean;
      items: ReservationItem[];
    };
  };
};

export function HistoryView({ data }: { data: HistoryResponse }) {
  return (
    <HistoryLists
      guests={data.tabs?.guests}
      reservations={data.tabs?.reservations}
    />
  );
}

export function ReservationsView({
  data,
}: {
  data: { type: string; items: ReservationItem[] };
}) {
  return <ReservationList items={data.items || []} />;
}

export function AdditionalInfoView({
  data,
}: {
  data: { sections: AdditionalSections };
}) {
  return <AdditionalInfoLists sections={data.sections} />;
}

export function MaintenanceView({ data }: { data: MaintenanceItem }) {
  return <MaintenanceForm record={data} />;
}

export function GuestEditView({ data }: { data: GuestItem }) {
  return (
    <Card>
      <GuestForm guest={data} />
    </Card>
  );
}

export function ParcelEditView({ data }: { data: ParcelItem }) {
  return (
    <Card>
      <ParcelForm parcel={data} />
    </Card>
  );
}

export function PetEditView({ data }: { data: PetItem }) {
  return (
    <Card>
      <PetForm pet={data} />
    </Card>
  );
}

export function VehicleEditView({ data }: { data: VehicleItem }) {
  return (
    <Card>
      <VehicleForm vehicle={data} />
    </Card>
  );
}

export function PreferenceEditView({ data }: { data: PreferenceItem }) {
  return (
    <Card>
      <PreferenceForm preference={data} />
    </Card>
  );
}
