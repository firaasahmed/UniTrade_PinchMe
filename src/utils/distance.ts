import { campusesFor, type Campus } from "./campuses";

// how close a place is, in bands you can scan — not a travel time
export type Proximity = "on-campus" | "walk" | "cycle" | "commute";

export type CampusDistance = {
  km: number;
  campus: Campus;
  proximity: Proximity;
  // "1.2 km from UON Callaghan"
  label: string;
};

const EARTH_KM = 6371;

const rad = (deg: number): number => (deg * Math.PI) / 180;

// straight line between two points — everything that renders this says "straight line"
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

export function proximityFor(km: number): Proximity {
  if (km < 0.8) return "on-campus";
  if (km < 2.5) return "walk";
  if (km < 6) return "cycle";
  return "commute";
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// a hand-typed address the extract didn't know has no point — 0,0 is the atlantic,
// not a location, so say nothing rather than "15,000 km from campus"
export function hasPoint(place: { lat: number; lng: number }): boolean {
  return place.lat !== 0 || place.lng !== 0;
}

// distance to the closest campus of the given uni, or null when we don't know the uni
export function campusDistance(
  place: { lat: number; lng: number },
  universityId: string,
): CampusDistance | null {
  if (!hasPoint(place)) return null;
  const [first, ...rest] = campusesFor(universityId);
  if (!first) return null;

  let best = first;
  let bestKm = haversineKm(place.lat, place.lng, best.lat, best.lng);
  for (const c of rest) {
    const km = haversineKm(place.lat, place.lng, c.lat, c.lng);
    if (km < bestKm) {
      best = c;
      bestKm = km;
    }
  }

  return {
    km: bestKm,
    campus: best,
    proximity: proximityFor(bestKm),
    label: `${formatKm(bestKm)} from ${best.name}`,
  };
}
