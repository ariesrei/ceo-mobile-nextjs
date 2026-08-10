"use client";

import Link from "next/link";
import type { AdditionalSections } from "@/lib/additional-info";
import { Card } from "./ui/Card";
import { PaginatedList } from "./ui/PaginatedList";

export function AdditionalInfoLists({ sections }: { sections: AdditionalSections }) {
  return (
    <div className="space-y-4">
      {sections.pets?.enabled ? (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Pets</h2>
            <Link
              href="/account/additional-info/pets/new"
              className="ceo-btn-accent rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Add pet
            </Link>
          </div>
          <PaginatedList
            items={sections.pets.items}
            pageSize={5}
            emptyMessage="No pets on file."
            getKey={(pet) => pet.id}
            renderItem={(pet) => (
              <div className="flex items-start justify-between gap-3 rounded-xl bg-[var(--surface-2)] p-3">
                <div>
                  <p className="font-medium">{pet.pet_name || "Pet"}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {[pet.type, pet.pet_breed].filter(Boolean).join(" · ")}
                  </p>
                  {pet.pending ? (
                    <span className="mt-1 inline-block text-xs font-medium text-amber-700">
                      Pending review
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/account/additional-info/pets/${pet.id}/edit`}
                  className="shrink-0 text-sm font-semibold text-[var(--accent)]"
                >
                  Edit
                </Link>
              </div>
            )}
          />
        </Card>
      ) : null}

      {sections.vehicles?.enabled ? (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Vehicles</h2>
            <Link
              href="/account/additional-info/vehicles/new"
              className="ceo-btn-accent rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Add vehicle
            </Link>
          </div>
          <PaginatedList
            items={sections.vehicles.items}
            pageSize={5}
            emptyMessage="No vehicles on file."
            getKey={(v) => v.id}
            renderItem={(v) => (
              <div className="flex items-start justify-between gap-3 rounded-xl bg-[var(--surface-2)] p-3">
                <div>
                  <p className="font-medium">
                    {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {[v.license_plate, v.color].filter(Boolean).join(" · ")}
                  </p>
                  {v.pending ? (
                    <span className="mt-1 inline-block text-xs font-medium text-amber-700">
                      Pending review
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/account/additional-info/vehicles/${v.id}/edit`}
                  className="shrink-0 text-sm font-semibold text-[var(--accent)]"
                >
                  Edit
                </Link>
              </div>
            )}
          />
        </Card>
      ) : null}

      {sections.preferences?.enabled ? (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Preferences</h2>
            <Link
              href="/account/additional-info/preferences/new"
              className="ceo-btn-accent rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Add preference
            </Link>
          </div>
          <PaginatedList
            items={sections.preferences.items}
            pageSize={5}
            emptyMessage="No preferences on file."
            getKey={(p) => p.id}
            renderItem={(p) => (
              <div className="flex items-start justify-between gap-3 rounded-xl bg-[var(--surface-2)] p-3">
                <div>
                  <p className="font-medium">
                    {[p.category, p.subcategory].filter(Boolean).join(" · ") ||
                      "Preference"}
                  </p>
                  {p.type ? (
                    <p className="text-sm text-[var(--muted)]">{p.type}</p>
                  ) : null}
                  {p.description ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">{p.description}</p>
                  ) : null}
                  {p.pending ? (
                    <span className="mt-1 inline-block text-xs font-medium text-amber-700">
                      Pending review
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/account/additional-info/preferences/${p.id}/edit`}
                  className="shrink-0 text-sm font-semibold text-[var(--accent)]"
                >
                  Edit
                </Link>
              </div>
            )}
          />
        </Card>
      ) : null}
    </div>
  );
}
