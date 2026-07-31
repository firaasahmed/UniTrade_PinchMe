// how much to trust the point — a dragged pin is not a rooftop match
export type GeoPrecision = "rooftop" | "street" | "locality" | "pin";

// a resolved address: what the user picked, where it is, and who said so
export type PlaceRef = {
  // "6 Timmins St, Ultimo NSW 2007"
  formatted: string;
  lat: number;
  lng: number;
  precision: GeoPrecision;
  // provider name, so a bad batch can be traced and re-resolved
  source: string;
  // the provider's own id where it has one, e.g. a g-naf address pid
  sourceId?: string;
};

export type TravelMode = "walk" | "cycle" | "transit" | "drive";

// what an autocomplete dropdown renders — resolve() turns one into a PlaceRef
export type AddressSuggestion = {
  id: string;
  label: string;
};

export type CampusProximity = {
  campusId: string;
  campusName: string;
  straightLineMeters: number;
  // minutes by mode; a mode is absent when nothing could compute it
  minutes: Partial<Record<TravelMode, number>>;
};

// the enrichment block frozen onto a listing at write time.
// the read path renders this and never calls a geo service
export type ProximityFacts = {
  computedAt: string;
  campuses: CampusProximity[];
};
