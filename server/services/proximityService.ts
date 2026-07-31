import type { CampusProximity, ProximityFacts, TravelMode } from "../../src/types/Place.ts";
import { campusesFor, type Campus } from "../../src/utils/campuses.ts";
import { haversineKm } from "../../src/utils/distance.ts";
import { journeyMinutes, supportedModes } from "../transit.ts";
import { systemClock } from "../lib/clock.ts";

// campuses carry no id yet — derived from the name until the seed regenerates with real ones
const campusId = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// run once when a listing is saved, never on read. a provider outage degrades to
// straight-line only rather than failing the save
export async function proximityFor(
  place: { lat: number; lng: number },
  universityIds: string[],
): Promise<ProximityFacts> {
  const modes = supportedModes();
  const campuses = universityIds.flatMap((id) => campusesFor(id));

  const measured = await Promise.all(
    campuses.map((campus) => measure(place, campus, modes)),
  );

  return {
    computedAt: systemClock(),
    // nearest first, so the ui can take the head without re-sorting
    campuses: measured.sort((a, b) => a.straightLineMeters - b.straightLineMeters),
  };
}

async function measure(
  place: { lat: number; lng: number },
  campus: Campus,
  modes: TravelMode[],
): Promise<CampusProximity> {
  const straightLineMeters = Math.round(
    haversineKm(place.lat, place.lng, campus.lat, campus.lng) * 1000,
  );

  const legs = await Promise.all(
    modes.map(async (mode) => [mode, await journeyMinutes(place, campus, mode)] as const),
  );

  const minutes: Partial<Record<TravelMode, number>> = {};
  for (const [mode, mins] of legs) {
    if (mins !== null) minutes[mode] = mins;
  }

  return {
    campusId: campusId(campus.name),
    campusName: campus.name,
    straightLineMeters,
    minutes,
  };
}
