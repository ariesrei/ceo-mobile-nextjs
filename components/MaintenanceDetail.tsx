import type { MaintenanceItem } from "@/lib/maintenance";
import { FastLink } from "./FastLink";

export function MaintenanceDetail({
  record,
  isStaff = false,
}: {
  record: MaintenanceItem;
  isStaff?: boolean;
}) {
  const rows = [
    ["Type", record.type_label],
    ["Status", record.status_label],
    ["Priority", record.maintenance_priority],
    ["Requested", record.maintenance_date_request],
    ["Requested by", record.request_by_name],
    ["Unit", record.unit_title],
    ["Location", record.location_label],
    ["Department", record.department_label],
    ["Description", record.maintenance_description],
    ["Notes", record.maintenance_symptoms],
    ["Assigned", record.assigned_name],
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
        {record.photos?.length ? (
          <div className="ceo-wo-detail__row">
            <dt>Photos</dt>
            <dd className="flex flex-wrap gap-2">
              {record.photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.url}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
      {isStaff ? (
        <FastLink
          href={`/account/maintenance/${record.id}/edit`}
          className="ceo-wo-detail__edit"
        >
          Edit
        </FastLink>
      ) : null}
    </div>
  );
}
