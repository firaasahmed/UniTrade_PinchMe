import type { TravelMode } from "../src/types/Place.ts";

export type Point = { lat: number; lng: number };

// ALL journey-time lookup goes through here — tfnsw, ptv, osrm all fit this shape.
// null means "no answer", never a guessed number
export type TransitProvider = {
  name: string;
  modes: TravelMode[];
  journeyMinutes(from: Point, to: Point, mode: TravelMode): Promise<number | null>;
};

const noProvider: TransitProvider = {
  name: "none",
  modes: [],
  journeyMinutes: () => Promise.resolve(null),
};

let active: TransitProvider = noProvider;

export function useTransitProvider(provider: TransitProvider): void {
  active = provider;
}

export function transitProviderName(): string {
  return active.name;
}

export function supportedModes(): TravelMode[] {
  return active.modes;
}

// one mode, one leg — a provider that can't do this mode says null rather than throwing
export async function journeyMinutes(
  from: Point,
  to: Point,
  mode: TravelMode,
): Promise<number | null> {
  if (!active.modes.includes(mode)) return null;
  try {
    return await active.journeyMinutes(from, to, mode);
  } catch {
    // a routing outage must not block someone publishing a listing
    return null;
  }
}
