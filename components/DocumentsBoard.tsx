"use client";

import { useEffect, useMemo, useState } from "react";
import { FastLink } from "./FastLink";
import {
  listDocumentFolders,
  type DocumentFolder,
} from "@/lib/helpers/documents";
import { ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

function FolderIcon({ category }: { category: string }) {
  const tone =
    category === "unit" ? "unit" : category === "forms" ? "forms" : "building";
  return (
    <span className={`ceo-docs-row__icon ceo-docs-row__icon--${tone}`} aria-hidden>
      <svg viewBox="0 0 24 24">
        <path d="M3.2 8.1A1.7 1.7 0 0 1 4.9 6.4h5.2l1.6 1.8h8.2A1.7 1.7 0 0 1 21.6 9.9v8.4a1.7 1.7 0 0 1-1.7 1.7H4.9A1.7 1.7 0 0 1 3.2 18.3V8.1Z" />
        <path d="M3.4 7.2h5.4l1.2 1.4H3.4V7.2Z" opacity="0.72" />
      </svg>
    </span>
  );
}

const TABS = [
  { id: "all", label: "All" },
  { id: "building", label: "Building" },
  { id: "unit", label: "Unit" },
  { id: "forms", label: "Forms" },
] as const;

function fileLabel(count: number): string {
  return count === 1 ? "1 file" : `${count} files`;
}

export function DocumentsBoard() {
  const [items, setItems] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");

  useEffect(() => {
    listDocumentFolders()
      .then((data) => {
        if (data.ok) setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((item) => item.category === tab);
  }, [items, tab]);

  return (
    <div className="ceo-docs">
      <div className="ceo-news-tabs" role="tablist" aria-label="Document type">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "is-active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {pending ? (
        <ListSkeleton rows={5} height={72} />
      ) : (
        <PaginatedList
          items={visible}
          listClassName="ceo-docs-list"
          emptyIcon="folder"
          emptyMessage={
            tab === "all"
              ? "No documents yet"
              : `No ${TABS.find((item) => item.id === tab)?.label || ""} folders`
          }
          emptySubtitle={
            tab === "all"
              ? "Community folders will show up here."
              : `Nothing filed under ${TABS.find((item) => item.id === tab)?.label || "this tab"} yet.`
          }
          getKey={(item) => item.id}
          renderItem={(item) => (
            <FastLink href={`/account/documents/${item.id}`} className="ceo-docs-row">
              <FolderIcon category={item.category} />
              <span className="ceo-docs-row__body">
                <b>{item.title}</b>
                <small>{fileLabel(item.count)}</small>
              </span>
            </FastLink>
          )}
        />
      )}
    </div>
  );
}
