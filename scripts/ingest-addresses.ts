import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { REGIONS, ADDRESS_DB, NSW_ADDRESS_QUERY_URL } from "../server/geo/nswSource.ts";

// pulls the address extract for our regions into data/addresses.db.
// one-off bulk copy, not a runtime dependency — the app only ever reads the local file.
// safe to re-run: it resumes from the last object id per region
// npx tsx scripts/ingest-addresses.ts

const PAGE = 2000;
const RETRIES = 5;
const PAUSE_MS = 150;

type Feature = {
  attributes: {
    objectid: number;
    formattedaddress: string | null;
    // the service types this as an integer, so it arrives as a number
    postcode: number | string | null;
    localityname: string | null;
    // the source carries both "ST" and "STREET", so we never guess at abbreviations
    streettype: string | null;
    streettypedescription: string | null;
  };
  geometry?: { x: number; y: number };
};

// suburb shortenings people type that the source doesn't carry
const SUBURB_SHORT: Record<string, string[]> = {
  north: ["nth", "n"],
  south: ["sth", "s"],
  east: ["e"],
  west: ["w"],
  mount: ["mt"],
  saint: ["st"],
  gardens: ["gdns"],
  heights: ["hts"],
  park: ["pk"],
  beach: ["bch"],
  point: ["pt"],
  creek: ["ck"],
  upper: ["up"],
  lower: ["lwr"],
  valley: ["vly"],
};

// a number bound into a TEXT column lands as '2304.0' — sqlite stringifies the
// double it was given. so the postcode becomes text here, before it ever binds
function postcodeText(v: number | string | null | undefined): string | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(Math.trunc(n)).padStart(4, "0");
}

const words = (s: string): string[] =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);

// everything a person might type for this address, in one blob.
// the display string stays untouched — this is only what fts sees
function searchBlob(a: Feature["attributes"]): string {
  const parts = new Set<string>();
  for (const w of words(a.formattedaddress ?? "")) parts.add(w);
  for (const w of words(a.streettype ?? "")) parts.add(w);
  for (const w of words(a.streettypedescription ?? "")) parts.add(w);
  for (const w of words(a.localityname ?? "")) {
    parts.add(w);
    for (const short of SUBURB_SHORT[w] ?? []) parts.add(short);
  }
  const pc = postcodeText(a.postcode);
  if (pc) parts.add(pc);
  return [...parts].join(" ");
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// deep resultOffset paging times the service out, so page by object id instead
async function fetchPage(bbox: string, afterId: number): Promise<Feature[]> {
  const qs = new URLSearchParams({
    geometry: bbox,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    where: `objectid>${afterId}`,
    outFields:
      "objectid,formattedaddress,postcode,localityname,streettype,streettypedescription",
    orderByFields: "objectid",
    resultRecordCount: String(PAGE),
    f: "json",
  });
  const url = `${NSW_ADDRESS_QUERY_URL}?${qs.toString()}`;

  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status >= 500 || res.status === 429) throw new Error(`http ${res.status}`);
      if (!res.ok) throw new Error(`http ${res.status}`);
      const body = (await res.json()) as { features?: Feature[]; error?: unknown };
      if (body.error) throw new Error(JSON.stringify(body.error));
      return body.features ?? [];
    } catch (e) {
      if (attempt > RETRIES) throw e;
      const wait = 1000 * 2 ** (attempt - 1);
      process.stdout.write(`\n  retry ${attempt}/${RETRIES} after ${wait}ms (${String(e)})\n`);
      await sleep(wait);
    }
  }
}

function openDb(): DatabaseSync {
  mkdirSync("data", { recursive: true });
  const db = new DatabaseSync(ADDRESS_DB);

  // the search column changed shape — rebuild rather than half-migrate a derived index
  const cols = (db.prepare("PRAGMA table_info(addresses)").all() as { name: string }[]).map(
    (c) => c.name,
  );
  if (cols.length > 0 && !cols.includes("search")) {
    console.log("schema changed, rebuilding the extract");
    db.exec("DROP TABLE IF EXISTS addresses_fts; DROP TABLE IF EXISTS addresses; DELETE FROM ingest_progress;");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id        INTEGER PRIMARY KEY,
      formatted TEXT NOT NULL,
      -- every form a person might type; display stays in formatted
      search    TEXT NOT NULL,
      lat       REAL NOT NULL,
      lng       REAL NOT NULL,
      postcode  TEXT,
      locality  TEXT
    );
    CREATE TABLE IF NOT EXISTS ingest_progress (
      region     TEXT PRIMARY KEY,
      lastObjectId INTEGER NOT NULL
    );
    -- prefix index so "6 timm" matches while you type
    CREATE VIRTUAL TABLE IF NOT EXISTS addresses_fts
      USING fts5(search, content='addresses', content_rowid='id', prefix='2 3 4');
  `);

  // extracts written before postcodeText existed hold '2304.0'. rows upsert by
  // objectid and a finished region fetches nothing, so a re-run would never
  // rewrite them — this repairs in place rather than asking for a fresh 103mb pull.
  // the search blob is unaffected: it stringified the number as '2304' already
  const stale = db.prepare("SELECT 1 FROM addresses WHERE postcode LIKE '%.%' LIMIT 1").get();
  if (stale) {
    console.log("normalising postcodes stored as floats");
    db.exec(`
      UPDATE addresses
      SET postcode = printf('%04d', CAST(postcode AS INTEGER))
      WHERE postcode LIKE '%.%'
    `);
  }

  return db;
}

async function ingestRegion(db: DatabaseSync, name: string, bbox: string): Promise<number> {
  const insert = db.prepare(
    "INSERT OR REPLACE INTO addresses (id,formatted,search,lat,lng,postcode,locality) VALUES (?,?,?,?,?,?,?)",
  );
  const saveProgress = db.prepare(
    "INSERT OR REPLACE INTO ingest_progress (region,lastObjectId) VALUES (?,?)",
  );
  const resumed = db.prepare("SELECT lastObjectId FROM ingest_progress WHERE region = ?").get(name) as
    | { lastObjectId: number }
    | undefined;

  let afterId = resumed?.lastObjectId ?? 0;
  let written = 0;
  if (afterId > 0) process.stdout.write(`  ${name}: resuming after objectid ${afterId}\n`);

  for (;;) {
    const features = await fetchPage(bbox, afterId);
    if (features.length === 0) break;

    db.exec("BEGIN");
    for (const f of features) {
      const a = f.attributes;
      afterId = Math.max(afterId, a.objectid);
      if (!a.formattedaddress || !f.geometry) continue;
      insert.run(
        a.objectid,
        a.formattedaddress,
        searchBlob(a),
        f.geometry.y,
        f.geometry.x,
        postcodeText(a.postcode),
        a.localityname,
      );
      written++;
    }
    saveProgress.run(name, afterId);
    db.exec("COMMIT");

    process.stdout.write(`\r  ${name}: ${written}`);
    if (features.length < PAGE) break;
    await sleep(PAUSE_MS);
  }
  process.stdout.write("\n");
  return written;
}

// suburb words only, deliberately. street names are far too dense to correct:
// 7,700 street words average two-plus near twins each, while 243 suburb words
// have two collisions between them. correcting a street name invents an address
function buildVocab(db: DatabaseSync): number {
  db.exec(`
    DROP TABLE IF EXISTS vocab;
    CREATE TABLE vocab (term TEXT PRIMARY KEY, uses INTEGER NOT NULL);
  `);

  const counts = new Map<string, number>();
  for (const row of db.prepare("SELECT locality FROM addresses WHERE locality IS NOT NULL").iterate() as Iterable<{
    locality: string;
  }>) {
    for (const w of row.locality.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length < 4 || /^\d+$/.test(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }

  const insert = db.prepare("INSERT OR REPLACE INTO vocab (term, uses) VALUES (?,?)");
  db.exec("BEGIN");
  for (const [term, uses] of counts) insert.run(term, uses);
  db.exec("COMMIT");
  return counts.size;
}

async function main(): Promise<void> {
  const db = openDb();
  for (const region of REGIONS) {
    await ingestRegion(db, region.name, region.bbox);
  }

  // external-content fts, so the index is built once at the end rather than per row
  console.log("building search index");
  db.exec("INSERT INTO addresses_fts(addresses_fts) VALUES ('rebuild')");
  console.log(`building spelling vocabulary — ${buildVocab(db)} terms`);
  db.exec("ANALYZE");

  const count = (db.prepare("SELECT COUNT(*) c FROM addresses").get() as { c: number }).c;
  console.log(`done — ${count} addresses in ${ADDRESS_DB}`);
}

void main();
