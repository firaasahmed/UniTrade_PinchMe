// where the address extract comes from and which slices of nsw we keep.
// see docs/data-sources.md for the licence and attribution
export const NSW_ADDRESS_QUERY_URL =
  "https://portal.spatial.nsw.gov.au/server/rest/services/Hosted/NSW_Address_Point_Formatted/FeatureServer/0/query";

export const ADDRESS_DB = "data/addresses.db";

// bounding boxes are "xmin,ymin,xmax,ymax" in wgs84 — one per uon campus cluster
export const REGIONS: { name: string; bbox: string }[] = [
  { name: "Newcastle", bbox: "151.50,-33.05,151.90,-32.75" },
  { name: "Central Coast", bbox: "151.20,-33.55,151.55,-33.20" },
];
