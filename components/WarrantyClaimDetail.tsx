"use client";

import { useMemo, useState } from "react";
import { useWarrantyStaff } from "@/hooks/useWarrantyStaff";
import { saveWarrantyPhotos } from "@/lib/helpers/warranties";
import type { WarrantyItem, WarrantyPhoto } from "@/lib/warranties";
import { CameraCapturePhotos } from "./CameraCapturePhotos";
import { ClaimThumb, claimContactName, claimMetaLines, claimThumbSrc } from "./ClaimThumb";
import { FastLink } from "./FastLink";
import { EmptyState } from "./ui/ListState";
import { ImageIcon } from "./ui/Icons";

type Tab = "details" | "updates" | "files" | "timeline";
type FileFilter = "all" | "photos";

type PathEvent = {
  actor: string;
  initials: string;
  at?: string;
  message: string;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "updates", label: "Updates" },
  { id: "files", label: "Files" },
  { id: "timeline", label: "Timeline" },
];

function contactName(record: WarrantyItem) {
  return claimContactName(record) || "Resident";
}

function tradeLabel(record: WarrantyItem) {
  const raw = record.trade_labels;
  if (Array.isArray(raw)) return raw.filter(Boolean).join(", ");
  return raw || "";
}

function isDocumentUrl(url: string) {
  return /\.(pdf|docx?|xlsx?|pptx?|txt)(\?|#|$)/i.test(url);
}

function claimPathEvents(record: WarrantyItem): PathEvent[] {
  const contact = contactName(record);
  const events: PathEvent[] = [
    {
      actor: contact,
      initials: contact.charAt(0).toUpperCase() || "•",
      at: record.created_date,
      message: record.photos?.length
        ? "Created claim and added photos."
        : "Created claim.",
    },
  ];

  const vendor = (record.subcontractor_name || "").trim();
  if (record.is_assigned || vendor) {
    events.push({
      actor: vendor || contact,
      initials: (vendor || contact).charAt(0).toUpperCase() || "•",
      at: record.created_date,
      message: vendor ? `Assigned to ${vendor}.` : "Assigned.",
    });
  }

  const status = (record.status_label || "").trim();
  if (status) {
    events.push({
      actor: vendor || contact,
      initials: (vendor || contact).charAt(0).toUpperCase() || "•",
      at: record.created_date,
      message: status,
    });
  }

  return events;
}

function ProgressPath({ events }: { events: PathEvent[] }) {
  return (
    <ol className="ceo-feed">
      {events.map((e, i) => (
        <li key={`${e.actor}-${e.message}-${i}`} className="ceo-feed__item">
          <span className="ceo-feed__rail" aria-hidden>
            <span className="ceo-feed__avatar">{e.initials}</span>
          </span>
          <div className="min-w-0">
            <div className="ceo-feed__who">
              <p className="ceo-feed__name">{e.actor}</p>
              {e.at ? <p className="ceo-feed__at">{e.at}</p> : null}
            </div>
            <p className="ceo-feed__msg">{e.message}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function WarrantyClaimDetail({
  record,
  canEdit,
  isStaff,
}: {
  record: WarrantyItem;
  canEdit: boolean;
  isStaff: boolean;
}) {
  const staff = useWarrantyStaff(isStaff);
  const [tab, setTab] = useState<Tab>("details");
  const [fileFilter, setFileFilter] = useState<FileFilter>("all");
  const [photos, setPhotos] = useState<WarrantyPhoto[]>(record.photos || []);
  const [fileError, setFileError] = useState("");
  const [savingFiles, setSavingFiles] = useState(false);

  const title =
    record.warranty_describe_the_request ||
    record.warranty_describe_the_request_single ||
    record.unit_title ||
    "Warranty claim";
  const contact = contactName(record);
  const events = useMemo(() => claimPathEvents(record), [record]);
  const meta = claimMetaLines(record, title);
  const request =
    record.warranty_describe_the_request ||
    record.warranty_describe_the_request_single ||
    "";
  const images = photos.filter((photo) => !isDocumentUrl(photo.url));
  const documents = photos.filter((photo) => isDocumentUrl(photo.url));

  async function persistPhotos(next: WarrantyPhoto[]) {
    setPhotos(next);
    setFileError("");
    setSavingFiles(true);
    try {
      const saved = await saveWarrantyPhotos(
        record,
        next.map((photo) => photo.id)
      );
      if (!saved.ok) {
        setFileError(saved.message || "Could not save photos.");
      }
    } catch {
      setFileError("Could not save photos.");
    } finally {
      setSavingFiles(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="ceo-claim-head">
        <ClaimThumb src={claimThumbSrc(record)} name={contact} size="head" />
        <div className="min-w-0 flex-1">
          <p className="ceo-claim-head__title">{title}</p>
          {meta.length ? (
            <div className="ceo-claim-card__meta mt-1">
              {meta.map((line, i) => (
                <span key={`${i}-${line}`}>{line}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="ceo-seg">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "is-active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <div className="space-y-3">
          {contact ? (
            <div className="ceo-contact-card">
              <ClaimThumb
                src={claimThumbSrc(record)}
                name={contact}
                size="contact"
              />
              <div className="min-w-0">
                <p className="ceo-contact-card__name">{contact}</p>
                {record.warranty_email_address ? (
                  <p className="ceo-contact-card__meta">
                    {record.warranty_email_address}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="ceo-warranty-detail">
            <Row label="Status" value={record.status_label} />
            <Row
              label="Type"
              value={record.type_label || String(record.warranty_type || "")}
            />
            <Row label="Unit" value={record.unit_title} />
            <Row label="First name" value={record.warranty_first_name} />
            <Row label="Last name" value={record.warranty_last_name} />
            <Row label="Email" value={record.warranty_email_address} />
            <Row label="Phone" value={record.warranty_tel_number} />
            <Row label="Locations" value={record.location_labels} />
            <Row label="Request" value={request} />
            <Row label="Entry date" value={record.warranty_entry_date} />
            <Row
              label="Window"
              value={[
                record.warranty_entry_start_time,
                record.warranty_entry_end_time,
              ]
                .filter(Boolean)
                .join(" – ")}
            />
            <Row label="Notes" value={record.warranty_entry_notes} />
            {staff ? (
              <Row label="Subcontractor" value={record.subcontractor_name} />
            ) : null}
            {staff ? <Row label="Trades" value={tradeLabel(record)} /> : null}
            {staff ? (
              <Row label="Due" value={record.warranty_sources_target_due} />
            ) : null}
            {staff ? (
              <Row
                label="Internal notes"
                value={record.warranty_sources_internal_note}
              />
            ) : null}
          </div>

          {staff && canEdit ? (
            <div className="space-y-2 pt-1">
              <FastLink
                href={`/account/warranties/${record.id}/status`}
                className="ceo-btn-solid w-full"
              >
                Update Status
              </FastLink>
              {!record.is_assigned && !record.warranty_sources_subcontractors ? (
                <FastLink
                  href={`/account/warranties/${record.id}/assign`}
                  className="ceo-btn-outline w-full"
                >
                  Assign Subcontractor
                </FastLink>
              ) : null}
              <FastLink
                href={`/account/warranties/${record.id}/edit`}
                className="ceo-btn-outline w-full"
              >
                Edit Claim
              </FastLink>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "updates" ? (
        events.length ? (
          <ProgressPath events={events} />
        ) : (
          <EmptyState subtitle="Status and assignment notes will show here.">
            No updates yet
          </EmptyState>
        )
      ) : null}

      {tab === "files" ? (
        <div className="space-y-3">
          <div className="ceo-chips">
            {(
              [
                ["all", "All", null],
                ["photos", "Photos", ImageIcon],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                className={fileFilter === id ? "is-active" : ""}
                onClick={() => setFileFilter(id)}
              >
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {label}
              </button>
            ))}
          </div>

          {fileFilter === "all" || fileFilter === "photos" ? (
            staff && canEdit ? (
              <div className="space-y-2">
                <CameraCapturePhotos
                  variant="tiles"
                  label="Photos"
                  photos={images}
                  onChange={(next) => persistPhotos([...documents, ...next])}
                  uploadUrl="/api/wp/warranties/media"
                  parentIdKey="warranty_id"
                  parentId={record.id}
                  disabled={savingFiles}
                />
                {fileError ? (
                  <p className="text-sm text-[var(--danger)]">{fileError}</p>
                ) : null}
              </div>
            ) : images.length ? (
              <ul className="grid grid-cols-3 gap-2">
                {images.map((p) => (
                  <li key={p.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="ceo-file-thumb" />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="file" subtitle="Photos attached to this claim will show here.">
                No photos
              </EmptyState>
            )
          ) : null}

        </div>
      ) : null}

      {tab === "timeline" ? (
        events.length ? (
          <ol className="ceo-timeline">
            {events.map((e, i) => (
              <li
                key={`${e.actor}-${e.message}-${i}`}
                className="ceo-timeline__item is-progress"
              >
                <p className="ceo-timeline__title">{e.message}</p>
                {e.at ? <p className="ceo-timeline__at">{e.at}</p> : null}
                <p className="ceo-timeline__detail">{e.actor}</p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState subtitle="Created, assigned, and status changes will show here.">
            No timeline yet
          </EmptyState>
        )
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
