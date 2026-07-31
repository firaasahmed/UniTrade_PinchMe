import type { AddressSuggestion, PlaceRef } from "../src/types/Place.ts";

// ALL address lookup goes through here — nothing else calls a geocoder.
// every implementation is local; no provider here reaches a metered api
export type GeocodeProvider = {
  name: string;
  suggest(query: string, limit: number): Promise<AddressSuggestion[]>;
  resolve(id: string): Promise<PlaceRef | null>;
  // a suburb's mean point, where the provider can work one out
  localityCentroid?(suburb: string, postcode: string): { lat: number; lng: number } | null;
};

// no provider configured yet — the app still runs, hosts just type the address
const noProvider: GeocodeProvider = {
  name: "none",
  suggest: () => Promise.resolve([]),
  resolve: () => Promise.resolve(null),
};

let active: GeocodeProvider = noProvider;

export function useGeocodeProvider(provider: GeocodeProvider): void {
  active = provider;
}

export function geocodeProviderName(): string {
  return active.name;
}

// too short a query matches half the country — don't bother the provider
export async function suggestAddresses(query: string, limit = 8): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  return active.suggest(q, limit);
}

export async function resolveAddress(id: string): Promise<PlaceRef | null> {
  return active.resolve(id);
}

// a hand-placed marker is a real place, it just isn't a matched address
export function pinnedPlace(formatted: string, lat: number, lng: number): PlaceRef {
  return { formatted, lat, lng, precision: "pin", source: "user-pin" };
}

export type ManualAddress = {
  street: string;
  suburb: string;
  state: string;
  postcode: string;
};

// "6 Timmins St" + "Mayfield" + "NSW" + "2304" -> "6 Timmins St, Mayfield NSW 2304"
export function formatManual(a: ManualAddress): string {
  const tail = [a.suburb.trim(), a.state.trim().toUpperCase(), a.postcode.trim()]
    .filter((s) => s !== "")
    .join(" ");
  return [a.street.trim(), tail].filter((s) => s !== "").join(", ");
}

// typed by hand, so never a match — coordinates only when the extract knows the suburb
export function manualPlace(a: ManualAddress): PlaceRef {
  const point = active.localityCentroid?.(a.suburb, a.postcode) ?? null;
  return {
    formatted: formatManual(a),
    lat: point?.lat ?? 0,
    lng: point?.lng ?? 0,
    precision: "locality",
    source: point ? "manual+nsw-spatial" : "manual",
  };
}
