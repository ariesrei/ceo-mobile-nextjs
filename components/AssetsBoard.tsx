"use client";

import { useEffect, useState } from "react";
import { FastLink } from "./FastLink";
import {
  loadAssets,
  petAgeLabel,
  type AssetPet,
  type AssetVehicle,
} from "@/lib/helpers/assets";
import { ListGo, ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { PlusIcon } from "./ui/Icons";
import { useHeldLoading } from "./ui/useLoadMore";

type Tab = "pets" | "vehicles";

function Mark({ name }: { name: string }) {
  return <span className="ceo-assets-card__mark">{(name[0] || "A").toUpperCase()}</span>;
}

function usableAssetPhoto(src: string) {
  const url = src.trim();
  if (!url || /^\d+$/.test(url) || /^\/account\/\d+\/?$/.test(url)) return "";
  if (
    /^https?:\/\//i.test(url) ||
    url.startsWith("//") ||
    url.includes("/wp-content/uploads/")
  ) {
    return url;
  }
  return "";
}

function AssetPhoto({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const url = usableAssetPhoto(src);
  if (!url || failed) return <Mark name={name} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" onError={() => setFailed(true)} />
  );
}

export function AssetsBoard() {
  const [tab, setTab] = useState<Tab>("pets");
  const [pets, setPets] = useState<AssetPet[]>([]);
  const [vehicles, setVehicles] = useState<AssetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const createHref =
    tab === "pets" ? "/account/assets/pets/new" : "/account/assets/vehicles/new";
  const items = tab === "pets" ? pets : vehicles;
  const showAdd = !pending && items.length > 0;

  useEffect(() => {
    loadAssets()
      .then((data) => {
        setPets(data.pets);
        setVehicles(data.vehicles);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ceo-assets">
      <div className="ceo-assets-head">
        <div className="ceo-assets-tabs" role="tablist" aria-label="Asset type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "pets"}
            className={tab === "pets" ? "is-active" : ""}
            onClick={() => setTab("pets")}
          >
            Pets
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "vehicles"}
            className={tab === "vehicles" ? "is-active" : ""}
            onClick={() => setTab("vehicles")}
          >
            Vehicles
          </button>
        </div>
        {showAdd ? (
          <FastLink
            href={createHref}
            className="ceo-assets-add"
            aria-label={tab === "pets" ? "Add pet" : "Add vehicle"}
          >
            <PlusIcon />
            Add
          </FastLink>
        ) : null}
      </div>

      {pending ? (
        <ListSkeleton rows={3} />
      ) : tab === "pets" ? (
        <PaginatedList
          items={pets}
          listClassName="ceo-assets-list"
          emptyIcon="pet"
          emptyMessage="No pets yet"
          emptySubtitle="When you add a pet, they will appear here."
          emptyAction={
            <FastLink href="/account/assets/pets/new">Add your first pet</FastLink>
          }
          getKey={(pet) => pet.id}
          renderItem={(pet) => {
            const name = pet.pet_name || "Pet";
            const age = petAgeLabel(pet.pet_dob);
            return (
              <FastLink
                href={`/account/assets/pets/${pet.id}/edit`}
                className="ceo-assets-card"
              >
                <AssetPhoto src={pet.photo} name={name} />
                <span>
                  <b>{name}</b>
                  {pet.pet_breed ? <em>{pet.pet_breed}</em> : null}
                  {age ? <small>{age}</small> : null}
                </span>
                <ListGo icon="pet" />
              </FastLink>
            );
          }}
        />
      ) : (
        <PaginatedList
          items={vehicles}
          listClassName="ceo-assets-list"
          emptyIcon="vehicle"
          emptyMessage="No vehicles yet"
          emptySubtitle="When you add a vehicle, it will appear here."
          emptyAction={
            <FastLink href="/account/assets/vehicles/new">Add your first vehicle</FastLink>
          }
          getKey={(vehicle) => vehicle.id}
          renderItem={(vehicle) => {
            const name =
              [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
              "Vehicle";
            const meta = [vehicle.color, vehicle.license_plate].filter(Boolean).join(" · ");
            return (
              <FastLink
                href={`/account/assets/vehicles/${vehicle.id}/edit`}
                className="ceo-assets-card"
              >
                <AssetPhoto src={vehicle.photo} name={name} />
                <span>
                  <b>{name}</b>
                  {meta ? <em>{meta}</em> : null}
                  {vehicle.pending ? <small>Pending review</small> : null}
                </span>
                <ListGo icon="vehicle" />
              </FastLink>
            );
          }}
        />
      )}
    </div>
  );
}
