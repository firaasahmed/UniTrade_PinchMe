import { DatabaseSync, type StatementSync } from "node:sqlite";
import { existsSync } from "node:fs";
import type { AddressSuggestion, PlaceRef } from "../../src/types/Place.ts";
import type { GeocodeProvider } from "../geo.ts";
import { ADDRESS_DB } from "./nswSource.ts";
import { correct, type Vocab } from "./spelling.ts";

type Row = { id: number; formatted: string; lat: number; lng: number };
type Centroid = { lat: number | null; lng: number | null; n: number };
type Handle = { search: StatementSync; byId: StatementSync; centroid: StatementSync; vocab: Vocab };

// fts5 syntax chars are stripped rather than escaped — nothing in an address needs them
function tokenise(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function hasVocab(db: DatabaseSync): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='vocab'")
    .get();
  return row !== undefined;
}

// every token becomes a prefix term, so "6 timm wara" narrows as you type
function run(db: Handle, terms: string[], raw: string, limit: number): { id: number; formatted: string }[] {
  const match = terms.map((t) => `"${t}"*`).join(" ");
  const leading = `${tokenise(raw)[0] ?? ""}%`;
  return db.search.all(match, leading, limit) as { id: number; formatted: string }[];
}

// opened on first use, not at boot — the extract is often written after the server starts
let handle: Handle | null = null;

function open(): Handle | null {
  if (handle) return handle;
  if (!existsSync(ADDRESS_DB)) return null;

  const db = new DatabaseSync(ADDRESS_DB, { readOnly: true });
  handle = {
    // an address whose display text starts with what was typed beats a merely
    // relevant one — otherwise oddly named streets outrank the obvious answer
    search: db.prepare(`
      SELECT a.id, a.formatted
      FROM addresses_fts f
      JOIN addresses a ON a.id = f.rowid
      WHERE addresses_fts MATCH ?
      ORDER BY
        CASE WHEN lower(a.formatted) LIKE ? THEN 0 ELSE 1 END,
        bm25(addresses_fts),
        length(a.formatted)
      LIMIT ?
    `),
    byId: db.prepare("SELECT id, formatted, lat, lng FROM addresses WHERE id = ?"),
    // mean of every address point in the suburb — good enough for a distance band
    centroid: db.prepare(`
      SELECT avg(lat) AS lat, avg(lng) AS lng, count(*) AS n
      FROM addresses
      WHERE lower(locality) = lower(?)
        AND (? = '' OR postcode = ?)
    `),
    vocab: hasVocab(db) ? (db.prepare("SELECT term, uses FROM vocab").all() as Vocab) : [],
  };
  return handle;
}

export const nswAddressProvider: GeocodeProvider = {
  name: "nsw-spatial",

  // a hand-typed suburb still gets a point if the extract knows it, so distance
  // bands keep working without an address match
  localityCentroid: (suburb, postcode) => {
    const db = open();
    if (!db || suburb.trim() === "") return null;
    const pc = postcode.trim();
    const row = db.centroid.get(suburb.trim(), pc, pc) as Centroid | undefined;
    if (!row || row.n === 0 || row.lat === null || row.lng === null) return null;
    return { lat: row.lat, lng: row.lng };
  },

  suggest: (query, limit) => {
    const db = open();
    if (!db) return Promise.resolve([]);

    const terms = tokenise(query);
    if (terms.length === 0) return Promise.resolve([]);

    let rows = run(db, terms, query, limit);
    // nothing matched, so try again with each word spell-checked against real ones
    if (rows.length === 0 && db.vocab.length > 0) {
      const fixed = terms.map((t) => correct(t, db.vocab) ?? t);
      if (fixed.some((t, i) => t !== terms[i])) rows = run(db, fixed, fixed.join(" "), limit);
    }

    const out: AddressSuggestion[] = rows.map((r) => ({ id: String(r.id), label: r.formatted }));
    return Promise.resolve(out);
  },

  resolve: (id) => {
    const db = open();
    if (!db) return Promise.resolve(null);
    const row = db.byId.get(Number(id)) as Row | undefined;
    if (!row) return Promise.resolve(null);
    const place: PlaceRef = {
      formatted: row.formatted,
      lat: row.lat,
      lng: row.lng,
      // every point in this dataset is a surveyed address point
      precision: "rooftop",
      source: "nsw-spatial",
      sourceId: String(row.id),
    };
    return Promise.resolve(place);
  },
};
