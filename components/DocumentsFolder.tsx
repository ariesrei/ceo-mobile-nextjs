"use client";

import { useEffect, useState } from "react";
import { listDocumentFiles, type DocumentFile } from "@/lib/helpers/documents";
import { ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

export function DocumentsFolder({ folderId }: { folderId: number }) {
  const [items, setItems] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);

  useEffect(() => {
    if (!folderId) {
      setLoading(false);
      return;
    }
    listDocumentFiles(folderId)
      .then((data) => {
        if (data.ok) setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, [folderId]);

  if (pending) return <ListSkeleton rows={3} height={72} />;

  return (
    <PaginatedList
      items={items}
      listClassName="ceo-docs-list"
      emptyIcon="file"
      emptyMessage="This folder is empty"
      emptySubtitle="Files added to this folder will show up here."
      getKey={(item) => item.id}
      renderItem={(item) => (
        <a
          href={item.url || "#"}
          className="ceo-docs-row"
          target={item.url ? "_blank" : undefined}
          rel={item.url ? "noreferrer" : undefined}
        >
          <span className="ceo-docs-row__icon" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path
                d="M7 3.8h7.2L20 9.6V20.2A1.6 1.6 0 0 1 18.4 21.8H7A1.6 1.6 0 0 1 5.4 20.2V5.4A1.6 1.6 0 0 1 7 3.8Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M14 3.8V9.4h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="ceo-docs-row__body">
            <b>{item.title}</b>
            {item.size ? <small>{item.size}</small> : null}
          </span>
        </a>
      )}
    />
  );
}
