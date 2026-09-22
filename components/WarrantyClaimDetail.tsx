"use client";

import { useMemo, useState } from "react";
import type { WarrantyItem } from "@/lib/warranties";
import { ClaimThumb, claimContactName, claimMetaLines, claimThumbSrc } from "./ClaimThumb";
import { FastLink } from "./FastLink";
import { StatusBadge } from "./ui/StatusBadge";
import { FileIcon, ImageIcon, PlusIcon, SendIcon } from "./ui/Icons";

type Tab = "details" | "updates" | "files" | "timeline";
type FileFilter = "all" | "photos" | "documents";

type PathEvent = {
  actor: string;
  initials: string;
  at?: string;
  message: string;
};

function contactName(record: WarrantyItem) {
  return claimContactName(record) || "Resident";
}

/** The claim record carries no update log, so the path is derived from it. */
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
  const [tab, setTab] = useState<Tab>("details");
  const [fileFilter, setFileFilter] = useState<FileFilter>("all");
  const [updateDraft, setUpdateDraft] = useState("");
  const [updateNotice, setUpdateNotice] = useState("");

  const title =
    record.warranty_describe_the_request ||
    record.warranty_describe_the_request_single ||
    record.unit_title ||
    "Warranty claim";
  const contact = contactName(record);
  const events = useMemo(() => claimPathEvents(record), [record]);
  const photos = record.photos || [];
  const meta = claimMetaLines(record, title);

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
        {record.status_label ? (
          <StatusBadge
            label={record.status_label}
            color={record.status_color}
          />
        ) : null}
      </div>

      <div className="ceo-seg">
        {(
          [
            ["details", "Details"],
            ["updates", "Updates"],
            ["files", "Files"],
            ["timeline", "Timeline"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "is-active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
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

          {title ? (
            <div className="ceo-warranty-detail">
              <p className="text-sm leading-relaxed">{title}</p>
            </div>
          ) : null}

          <div className="ceo-warranty-detail">
            {record.status_label ? (
              <div className="ceo-claim-status">
                <div className="min-w-0">
                  <p className="text-xs text-[var(--muted)]">Status</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {record.status_label}
                  </p>
                </div>
                <StatusBadge
                  label={record.status_label}
                  color={record.status_color}
                />
              </div>
            ) : null}
            <Row
              label="Type"
              value={record.type_label || String(record.warranty_type || "")}
            />
            <Row label="Unit" value={record.unit_title} />
            <Row label="Phone" value={record.warranty_tel_number} />
            <Row label="Entry date" value={record.warranty_entry_date} />
            <Row
              label="Window"
              value={[record.warranty_entry_start_time, record.warranty_entry_end_time]
                .filter(Boolean)
                .join(" – ")}
            />
            <Row label="Notes" value={record.warranty_entry_notes} />
            {isStaff ? (
              <Row label="Subcontractor" value={record.subcontractor_name} />
            ) : null}
            {isStaff ? (
              <Row label="Due" value={record.warranty_sources_target_due} />
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "updates" ? (
        <div className="space-y-4">
          <ProgressPath events={events} />

          {isStaff ? (
            <form
              className="ceo-composer"
              onSubmit={(e) => {
                e.preventDefault();
                setUpdateNotice(
                  "Posting updates connects to WordPress in a later pass."
                );
              }}
            >
              <input
                value={updateDraft}
                onChange={(e) => setUpdateDraft(e.target.value)}
                placeholder="Add an update…"
                aria-label="Add an update"
              />
              <button type="submit" aria-label="Send update">
                <SendIcon className="h-[18px] w-[18px]" />
              </button>
            </form>
          ) : null}
          {updateNotice ? (
            <p className="text-xs text-[var(--muted)]">{updateNotice}</p>
          ) : null}
        </div>
      ) : null}

      {tab === "files" ? (
        <div className="space-y-3">
          <div className="ceo-chips">
            {(
              [
                ["all", "All", null],
                ["photos", "Photos", ImageIcon],
                ["documents", "Documents", FileIcon],
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

          {fileFilter !== "documents" ? (
            photos.length ? (
              <ul className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <li key={p.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="ceo-file-thumb" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--muted)]">No photos attached yet.</p>
            )
          ) : null}

          {fileFilter !== "photos" ? (
            <div className="ceo-file-row">
              <span className="ceo-doc-badge" aria-hidden>
                <FileIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="ceo-doc-name">No documents attached</p>
                <p className="ceo-doc-size">
                  Documents upload from the claim edit screen.
                </p>
              </div>
            </div>
          ) : null}

          {isStaff && canEdit ? (
            <FastLink
              href={`/account/warranties/${record.id}/edit`}
              className="ceo-btn-solid w-full"
            >
              <PlusIcon className="h-4 w-4" />
              Add Files
            </FastLink>
          ) : null}
        </div>
      ) : null}

      {tab === "timeline" ? (
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
      ) : null}

      {isStaff && canEdit && tab === "details" ? (
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
