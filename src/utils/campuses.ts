// campus locations are fixed reference data, like hubs — not user data, so no db column
// a uni with several campuses lists them all; distance always measures to the nearest one
export type Campus = {
  name: string;
  lat: number;
  lng: number;
};

const CAMPUSES: Record<string, Campus[]> = {
  pinch: [{ name: "Pinch University", lat: -33.8688, lng: 151.2093 }],
  uon: [
    { name: "UON Callaghan", lat: -32.8926, lng: 151.7057 },
    { name: "UON Ourimbah", lat: -33.3608, lng: 151.369 },
    { name: "UON City", lat: -32.9283, lng: 151.7817 },
  ],
  usyd: [{ name: "USyd Camperdown", lat: -33.8886, lng: 151.1873 }],
  unsw: [{ name: "UNSW Kensington", lat: -33.9173, lng: 151.2313 }],
  uts: [{ name: "UTS Ultimo", lat: -33.883, lng: 151.199 }],
  mq: [{ name: "Macquarie", lat: -33.7738, lng: 151.1126 }],
  unimelb: [{ name: "Melbourne Parkville", lat: -37.7963, lng: 144.9614 }],
  monash: [
    { name: "Monash Clayton", lat: -37.9105, lng: 145.1362 },
    { name: "Monash Caulfield", lat: -37.877, lng: 145.043 },
  ],
  rmit: [{ name: "RMIT City", lat: -37.8076, lng: 144.9635 }],
  uq: [{ name: "UQ St Lucia", lat: -27.4975, lng: 153.0137 }],
  qut: [
    { name: "QUT Gardens Point", lat: -27.4776, lng: 153.0281 },
    { name: "QUT Kelvin Grove", lat: -27.4489, lng: 153.0129 },
  ],
  anu: [{ name: "ANU Acton", lat: -35.2777, lng: 149.1185 }],
  adelaide: [{ name: "Adelaide North Terrace", lat: -34.9205, lng: 138.6047 }],
  uwa: [{ name: "UWA Crawley", lat: -31.9803, lng: 115.8175 }],
};

export function campusesFor(universityId: string): Campus[] {
  return CAMPUSES[universityId] ?? [];
}
