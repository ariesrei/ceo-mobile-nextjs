import type { GuestItem } from "@/lib/guests";
import { FastLink } from "./FastLink";

export function GuestDetail({
  record,
  isStaff = false,
}: {
  record: GuestItem;
  isStaff?: boolean;
}) {
  const rows = [
    ["Guests", record.guest_names || record.title],
    ["Phone", record.guest_phone],
    ["Unit", record.unit_title],
    ["Resident", record.resident_name],
    ["Party size", record.guest_number ? String(record.guest_number) : ""],
    ["Check in", record.guest_check_in],
    ["Check out", record.guest_check_out],
    ["Status", record.status],
    ["Parking", record.guest_parking_stall],
    ["Plate", record.guest_license_plate],
    [
      "Vehicle",
      [record.guest_car_year, record.guest_car_make, record.guest_car_model, record.guest_car_color]
        .filter(Boolean)
        .join(" "),
    ],
  ].filter(([, value]) => Boolean(value));

  return (
    <div className="ceo-wo-detail-wrap">
      <dl className="ceo-wo-detail">
        {rows.map(([label, value]) => (
          <div key={label} className="ceo-wo-detail__row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {isStaff ? (
        <FastLink
          href={`/account/guests/${record.id}/edit`}
          className="ceo-wo-detail__edit"
        >
          Edit
        </FastLink>
      ) : null}
    </div>
  );
}
