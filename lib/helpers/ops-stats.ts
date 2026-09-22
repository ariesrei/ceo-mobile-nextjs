import { countGuests } from "./guests";
import { countOpenMaintenance } from "./maintenance";
import { countParcelsInStorage } from "./parcels";
import { listUpcomingReservations } from "./reservations";

export async function loadOpsOverview() {
  const [guests, parcels, maintenance, reservations] = await Promise.all([
    countGuests(),
    countParcelsInStorage(),
    countOpenMaintenance(),
    listUpcomingReservations(1),
  ]);
  return {
    guests: guests.checked_in,
    parcels,
    maintenance,
    reservations: reservations.ok ? reservations.total : 0,
  };
}
