import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";
import { seedListings } from "../server/data/seed/listings.ts";
import { seedUsers } from "../server/data/seed/users.ts";
import { ADDRESS_DB } from "../server/geo/nswSource.ts";
import type { ListingRow, TransitLink } from "../src/types/Listing.ts";
import type { User } from "../src/types/User.ts";

// re-homes the seed onto real newcastle addresses from data/addresses.db and
// re-emits the seed files. the copy stays hand-written; only geography is generated.
// npx tsx scripts/generate-seed.ts

// every listing gets a real surveyed address
const ADDRESS: Record<string, string> = {
  l1: "105 LORNA ST, WARATAH WEST NSW 2298",
  l2: "97 HOWE ST, LAMBTON NSW 2299",
  l3: "7 ALBERT ST, OURIMBAH NSW 2258",
  l4: "53 MARTON ST, SHORTLAND NSW 2307",
  l5: "6A HARVARD CL, JESMOND NSW 2299",
  l6: "26 BOLTON ST, NEWCASTLE NSW 2300",
  l7: "10 FRANCES ST, WALLSEND NSW 2287",
  l8: "5 WALLACE ST, ISLINGTON NSW 2296",
  l9: "27 GEORGE ST, TIGHES HILL NSW 2297",
  l10: "179 DENISON ST, HAMILTON NSW 2303",
  l11: "128 BRUCE ST, COOKS HILL NSW 2300",
  l12: "267 SANDGATE RD, SHORTLAND NSW 2307",
  l13: "22 ALEX CL, OURIMBAH NSW 2258",
  l14: "63 BOURKE ST, CARRINGTON NSW 2294",
  l15: "26 NEWLING ST, NIAGARA PARK NSW 2250",
  l16: "11 CORONATION ST, WARATAH WEST NSW 2298",
  l17: "2/11 BROWN ST, NEWCASTLE NSW 2300",
  l18: "3 WALLACE ST, ISLINGTON NSW 2296",
  l19: "87 HENRY ST, TIGHES HILL NSW 2297",
  l20: "1/206 LAMBTON RD, NEW LAMBTON NSW 2305",
  // both are campus accommodation, so they sit right on the campus edge
  l21: "130 UNIVERSITY DR, CALLAGHAN NSW 2308",
  l22: "5 KING ST, OURIMBAH NSW 2258",
};

// each account sits in the suburb they trade from — coordinates are the suburb centroid
const HOME: Record<string, string> = {
  usr2: "WARATAH WEST",
  usr3: "SHORTLAND",
  usr4: "CARRINGTON",
  usr5: "JESMOND",
  usr6: "LAMBTON",
  usr7: "ISLINGTON",
  usr8: "WALLSEND",
  usr9: "MEREWETHER",
  usr10: "HAMILTON",
  usr11: "TIGHES HILL",
  usr12: "NEWCASTLE",
  usr13: "COOKS HILL",
  usr14: "CALLAGHAN",
  usr15: "THE JUNCTION",
  usr16: "NEW LAMBTON",
  usr17: "GOSFORD",
  usr18: "OURIMBAH",
  usr19: "NIAGARA PARK",
  usr20: "OURIMBAH",
};

// city-specific names that no longer make sense once everything is newcastle
const RENAME: Record<string, string> = {
  usr15: "Hunter Street Property",
  usr17: "Coastline Lets",
};

// renamed agencies need their domain to match the new name
const EMAIL: Record<string, string> = {
  usr15: "hello@hunterstreetproperty.com.au",
  usr17: "rentals@coastlinelets.com.au",
};

// host-stated travel times, rewritten for the new locations
const TRANSIT: Record<string, TransitLink[]> = {
  l16: [
    { mode: "walk", to: "campus", minutes: 18 },
    { mode: "bus", to: "campus", minutes: 8 },
    { mode: "walk", to: "Waratah Station", minutes: 7 },
  ],
  l17: [
    { mode: "walk", to: "Newcastle Interchange", minutes: 6 },
    { mode: "train", to: "Warabrook (campus)", minutes: 14 },
    { mode: "bus", to: "campus", minutes: 27 },
  ],
  l18: [
    { mode: "bus", to: "campus", minutes: 16 },
    { mode: "walk", to: "Islington shops", minutes: 5 },
    { mode: "train", to: "Newcastle Interchange", minutes: 9 },
  ],
  l19: [
    { mode: "bus", to: "campus", minutes: 19 },
    { mode: "walk", to: "Maitland Rd shops", minutes: 6 },
  ],
  l20: [
    { mode: "bus", to: "campus", minutes: 21 },
    { mode: "walk", to: "Lambton shops", minutes: 6 },
  ],
  l21: [{ mode: "walk", to: "campus", minutes: 6 }],
  l22: [
    { mode: "walk", to: "campus", minutes: 5 },
    { mode: "train", to: "Gosford", minutes: 12 },
    { mode: "walk", to: "Ourimbah Station", minutes: 11 },
  ],
};

// handover spots that named a campus in another city
const MEETUP: Record<string, string> = {
  l5: "Meet at Jesmond Central",
  l6: "Meet at Newcastle Interchange",
  l7: "Meet at Wallsend Plaza",
  l8: "Pickup from Islington",
  l9: "Meet on campus or in town",
  l10: "Meet on Beaumont St, Hamilton",
};

// lines whose geography stopped being true after the move
const DESCRIPTION: Record<string, string> = {
  l18: "Lovely light room with double doors onto a little balcony. Gets sun most of the day which makes a big difference in winter. Quiet street but the bus into campus stops around the corner. Room comes furnished, house is shared with two others.",
};

const db = new DatabaseSync(ADDRESS_DB, { readOnly: true });
const findAddress = db.prepare("SELECT formatted, lat, lng FROM addresses WHERE formatted = ?");
const suburbCentre = db.prepare(
  "SELECT AVG(lat) lat, AVG(lng) lng, COUNT(*) n FROM addresses WHERE locality = ?",
);

// "11 CORONATION ST, WARATAH WEST NSW 2298" -> "Waratah West, NSW"
function publicLocation(formatted: string): string {
  const tail = formatted.split(",")[1]?.trim() ?? "";
  const suburb = tail.replace(/\s+NSW\s+\d{4}$/, "");
  return `${titleCase(suburb)}, NSW`;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const q = (s: string): string => JSON.stringify(s);
const round = (n: number): number => Number(n.toFixed(5));

function listingLine(l: ListingRow): string {
  const parts: string[] = [
    `id: ${q(l.id)}`,
    `sellerId: ${q(l.sellerId)}`,
    `title: ${q(l.title)}`,
    `description: ${q(l.description)}`,
    `priceCents: ${l.priceCents}`,
  ];
  if (l.rateUnit) parts.push(`rateUnit: ${q(l.rateUnit)}`);
  parts.push(
    `category: ${q(l.category)}`,
    `condition: ${q(l.condition)}`,
    `location: ${q(l.location)}`,
    `lat: ${l.lat}`,
    `lng: ${l.lng}`,
    `meetup: ${q(l.meetup)}`,
    `imageUrl: ${q(l.imageUrl)}`,
  );
  if (l.images) parts.push(`images: [${l.images.map(q).join(", ")}]`);
  if (l.unlimited !== undefined) parts.push(`unlimited: ${l.unlimited}`);
  parts.push(`status: ${q(l.status)}`);
  if (l.bedrooms !== undefined) parts.push(`bedrooms: ${l.bedrooms}`);
  if (l.bathrooms !== undefined) parts.push(`bathrooms: ${l.bathrooms}`);
  if (l.bondCents !== undefined) parts.push(`bondCents: ${l.bondCents}`);
  if (l.availableFrom) parts.push(`availableFrom: ${q(l.availableFrom)}`);
  if (l.leaseTerm) parts.push(`leaseTerm: ${q(l.leaseTerm)}`);
  if (l.furnished !== undefined) parts.push(`furnished: ${l.furnished}`);
  if (l.transit) {
    const t = l.transit
      .map((x) => `{ mode: ${q(x.mode)}, to: ${q(x.to)}, minutes: ${x.minutes} }`)
      .join(", ");
    parts.push(`transit: [${t}]`);
  }
  if (l.inspectionAvailability) {
    const a = l.inspectionAvailability;
    parts.push(
      `inspectionAvailability: { weekdays: [${a.weekdays.join(", ")}], times: [${a.times.map(q).join(", ")}], horizonDays: ${a.horizonDays}, blackout: [${a.blackout.map(q).join(", ")}], acceptsRequests: ${a.acceptsRequests} }`,
    );
  }
  parts.push(`createdAt: ${q(l.createdAt)}`, `updatedAt: ${q(l.updatedAt)}`);
  return `  { ${parts.join(", ")} },`;
}

function userLine(u: User): string {
  const parts: string[] = [
    `id: ${q(u.id)}`,
    `name: ${q(u.name)}`,
    `email: ${q(u.email)}`,
    `universityId: ${q(u.universityId)}`,
    `role: ${q(u.role)}`,
    `verified: ${u.verified}`,
  ];
  if (u.orgType) parts.push(`orgType: ${q(u.orgType)}`);
  parts.push(
    `location: ${q(u.location)}`,
    `lat: ${u.lat}`,
    `lng: ${u.lng}`,
    `createdAt: ${q(u.createdAt)}`,
  );
  return `  { ${parts.join(", ")} },`;
}

function rehomeListings(): ListingRow[] {
  return seedListings.map((l) => {
    const wanted = ADDRESS[l.id];
    if (!wanted) throw new Error(`no address mapped for ${l.id}`);
    const hit = findAddress.get(wanted) as { formatted: string; lat: number; lng: number } | undefined;
    if (!hit) throw new Error(`address not found in extract: ${wanted}`);

    const next: ListingRow = {
      ...l,
      description: DESCRIPTION[l.id] ?? l.description,
      meetup: MEETUP[l.id] ?? l.meetup,
      location: publicLocation(hit.formatted),
      lat: round(hit.lat),
      lng: round(hit.lng),
    };
    if (TRANSIT[l.id]) next.transit = TRANSIT[l.id];
    return next;
  });
}

function rehomeUsers(): User[] {
  return seedUsers.map((u) => {
    // the admin keeps its own login but shouldn't be sitting in another city
    if (u.id === "usr1") {
      return { ...u, location: "Newcastle, NSW", lat: -32.9283, lng: 151.7817 };
    }

    const suburb = HOME[u.id];
    if (!suburb) throw new Error(`no home suburb mapped for ${u.id}`);
    const c = suburbCentre.get(suburb) as { lat: number; lng: number; n: number };
    if (!c || c.n === 0) throw new Error(`no addresses for suburb ${suburb}`);

    // student addresses move to the one university; agencies keep their own domain
    const email =
      EMAIL[u.id] ?? (u.email.includes(".edu") ? `${u.email.split("@")[0]}@uon.edu.au` : u.email);

    return {
      ...u,
      name: RENAME[u.id] ?? u.name,
      email,
      universityId: "uon",
      location: `${titleCase(suburb)}, NSW`,
      lat: round(c.lat),
      lng: round(c.lng),
    };
  });
}

const listings = rehomeListings();
const users = rehomeUsers();

writeFileSync(
  "server/data/seed/listings.ts",
  `import type { ListingRow } from "../../../src/types/Listing.ts";

// generated by scripts/generate-seed.ts — coordinates come from the nsw address
// extract, so every listing sits on a real surveyed address. edit the copy here,
// but re-run the script rather than hand-editing locations
export const seedListings: ListingRow[] = [
${listings.map(listingLine).join("\n")}
];
`,
);

const header = seedUsers.length > 0 ? "" : "";
writeFileSync(
  "server/data/seed/users.ts",
  `import type { User } from "../../../src/types/User.ts";

// every seeded account shares one password: admin
// a fixed hash keeps the seed deterministic (bcrypt salts are random by design).
// it is deliberately weaker than the rules new signups face — these are throwaway
// demo logins, not accounts anyone should trust
export const SEED_PASSWORD_HASH = "$2b$10$kaBupPzAjwf2awDLNWs1iulpTnzG2eXUvmapT0A0DIQPWG7FaG1fW";

// generated by scripts/generate-seed.ts — one university (newcastle), suburb
// coordinates averaged from the nsw address extract
export const seedUsers: User[] = [
${users.map(userLine).join("\n")}
];
${header}`,
);

console.log(`wrote ${listings.length} listings, ${users.length} users`);
for (const l of listings) console.log(`  ${l.id.padEnd(4)} ${l.location.padEnd(20)} ${l.lat}, ${l.lng}`);
