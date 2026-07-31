# Data sources & external APIs

Every external service or dataset UniTrade touches, what it costs, and where it
is wired in. Update this file when a source is added, swapped or dropped.

Two rules govern everything here:

1. **One file per service.** Each external dependency has exactly one module
   that talks to it. Nothing else calls it directly.
2. **Enrich on write, never on read.** External data is fetched when a listing
   is saved and frozen onto the row. No page render calls an external service.
   This keeps the read path deterministic, free and fast, and means an outage
   delays enrichment rather than breaking the site.

---

## Summary

| Source | Used for | Cost | Key needed | Wired in |
|---|---|---|---|---|
| Pinch Payments | Payments, refunds | Test mode free | Yes | `server/pinch.ts` |
| NSW Spatial Services | Address search + coordinates | Free | No | `server/geo/nswAddressProvider.ts` |
| Manual entry | Addresses the extract doesn't cover | Free | No | `server/geo.ts` — `manualPlace` |
| Geoscape G-NAF | Fallback address dataset | Free (CC BY 4.0 + EULA) | No | not wired — fallback only |
| TfNSW Open Data | Public transport journey times | Free | Yes | `server/transit.ts` — not wired yet |
| Protomaps / OpenStreetMap | Map tiles | Free (self-hosted) | No | not wired yet |

Current monthly cost: **$0**, and there is no metered geocoder left in the
codebase to change that.

## Manual entry — the fallback everywhere the extract doesn't reach

The extract covers Newcastle and the Central Coast. Everywhere else, the host
types the address themselves: street, suburb, state, postcode. `manualPlace` in
`server/geo.ts` assembles the display string and asks the active provider for a
suburb centroid, so a hand-typed address still gets a point when we happen to
know the suburb.

| Outcome | `source` | Coordinates |
|---|---|---|
| Picked from the extract | `nsw-spatial` | rooftop |
| Typed, suburb known to the extract | `manual+nsw-spatial` | suburb mean |
| Typed, suburb unknown | `manual` | none — `0,0` |

`0,0` is the Atlantic, not a location, so `hasPoint()` in `src/utils/distance.ts`
gates every distance calculation on it. A listing with no point simply shows no
campus distance rather than "15,000 km from campus".

`AddressField` still offers the free local typeahead — it waits for 4 characters
and a 320ms pause, and stops asking once a query has returned nothing, since a
longer version of a query that missed can only miss too. "Enter it manually" is
always available beneath the box, so no address is ever un-enterable.

### Why Mapbox was dropped

It worked and the licensing was clean, but Permanent Geocoding has **no free
tier** — storing coordinates costs ~$5 per 1,000 from the first request, which
means any usage at all trips a "you've exceeded your free tier" notice. For a
product whose entire seed data sits in Newcastle, a metered national geocoder
bought nothing the extract wasn't already giving us for free. The provider seam
made removing it a one-line change in `server/app.ts`.

If national street-level coverage is ever needed, G-NAF is the route (below) —
not a metered API.

---

## Pinch Payments

The payment provider. Card details go browser → Pinch via CaptureJS and never
touch our server.

| | |
|---|---|
| Auth | `https://auth.getpinch.com.au/connect/token` |
| Test base | `https://api.getpinch.com.au/test` |
| Docs | https://docs.getpinch.com.au/llms.txt (append `.md` to any page) |
| Version header | `pinch-version: 2020.1` |
| Isolated in | `server/pinch.ts`, `src/api/pinch-api.ts` |

Keys live in `.env` (`PINCH_APP_ID`, `PINCH_SECRET`, `VITE_PINCH_PUBLISHABLE_KEY`).
`PINCH_SECRET` must never reach the browser. See CLAUDE.md for the full status
model and the deterministic dishonour-code triggers.

---

## NSW Spatial Services — address search

**This is our address source.** A public ArcGIS Feature Service published by
NSW Department of Customer Service (Spatial Services).

| | |
|---|---|
| Endpoint | `https://portal.spatial.nsw.gov.au/server/rest/services/Hosted/NSW_Address_Point_Formatted/FeatureServer/0/query` |
| Auth | None — no token, no registration |
| Cost | Free |
| Page size | 2,000 records per request (`resultOffset` + `orderByFields` to page) |
| Coverage | NSW only — 5,226,190 addresses statewide |

Returns `formattedaddress` already assembled (`"11 CORONATION ST, WARATAH WEST
NSW 2298"`) plus WGS84 point geometry, postcode and locality. No table joins.

### How we use it

A **one-time bulk extract**, not a runtime dependency. `scripts/ingest-addresses.ts`
pages the two bounding boxes covering UoN's campuses into `data/addresses.db`,
an SQLite file with an FTS5 prefix index. Autocomplete queries that local file —
the app never calls NSW Spatial at request time.

| Region | Bounding box | Addresses |
|---|---|---|
| Newcastle (Callaghan + City) | `151.50,-33.05,151.90,-32.75` | 220,562 |
| Central Coast (Ourimbah) | `151.20,-33.55,151.55,-33.20` | 192,051 |
| **Total ingested** | | **412,613** |

Finished `data/addresses.db` is ~103MB including the FTS index and the `search`
column. It is gitignored, so a deployed instance has no extract and every
address resolves through Mapbox — see the note above.

Regions are declared in `server/geo/nswSource.ts`. Add a bounding box there to
cover a new campus, then re-run the ingest:

```bash
npx tsx scripts/ingest-addresses.ts
```

### How the matching works

The industry pattern (Elastic's own G-NAF reference, Addressr, AddressKit) is a
flattened address string in a search engine with typeahead prefix matching. We do
the same, on SQLite FTS5 rather than Elasticsearch — right at 412k rows, and
`server/geo.ts` is where a move to OpenSearch would happen if we ever went
national at 15M.

Two columns, deliberately separate:

- `formatted` — exactly what the user sees, untouched
- `search` — every form a person might type, what FTS5 indexes

The `search` blob carries:

| Source | Fixes |
|---|---|
| `streettype` **and** `streettypedescription` from NSW | `st` *and* `street` both match |
| `localityname` plus shortenings (`nth`, `gdns`, `mt`, `hts`…) | `nth lambton`, `birmingham gdns` |
| postcode | `ourimbah 2258` |

Taking both street-type forms from the source is better than the usual
hand-maintained synonym list — it is authoritative and stays current. Note that
fuzzy matching alone cannot solve this: `st` to `street` is an edit distance of
4, well past any sane fuzziness budget.

**Ranking** puts addresses whose display text starts with what was typed first,
then bm25, then shorter strings. Without the first term, oddly named streets
outrank the obvious answer (`sandgate road` used to return "ROAD SANDGATE RD").

**Typos: suburbs are corrected, street names never are.** That split comes
straight from measuring the two namespaces:

| | Words | Pairs within 1 edit |
|---|---|---|
| Suburbs | 243 | 2 |
| Street names | 7,734 | 9,028 |

Street words average more than two near twins each — `milson`/`wilson`/`milton`,
`farnell`/`parnell`/`farrell`, `bowden`/`bowen`/`howden` are all real streets.
Correcting one doesn't fix a typo, it invents a different address. Suburbs, at
two collisions across the whole set, are safe to correct.

So `vocab` holds suburb words only (~263), matched with bounded
Damerau-Levenshtein — Damerau because transposition (`waratha` for `waratah`) is
the typo people actually make. The remaining rules:

- **Only when a strict search returns nothing.** A word that matches something
  real is never corrected away — `timins` stays Thomas Timins Pl.
- **One edit, never two.**
- **Never on a tie.** Two equally close candidates means return nothing.
- **Nothing under 5 characters**, where there is too little signal.

Two fixtures assert we return *nothing* for ambiguous or far-off input. That
refusal is a feature, not a gap. Street typos simply produce no results, which in
a typeahead the user fixes by backspacing.

Cost: a miss now resolves in ~2.5 ms against ~4.5 ms for a hit — correction is
cheaper than a successful query, so it is not worth optimising away.

`scripts/check-address-search.ts` is the regression check — 22 real queries with
expected top hits. Run it after touching tokenisation, the search blob, or
ranking:

```bash
npx tsx scripts/check-address-search.ts
```

### Gotchas found the hard way

- **Don't page with `resultOffset`.** Deep offsets make the service progressively
  slower and it returns HTTP 504 somewhere past ~90,000 records. The script pages
  by `objectid` instead (`where=objectid>{last}`), which stays fast at any depth.
- **The ingest is resumable.** Progress per region is kept in `ingest_progress`,
  and rows upsert on `objectid`, so re-running after a failure picks up where it
  stopped rather than starting over.
- **`lganame` is null** throughout this dataset, so regions filter by bounding box
  rather than council name.
- **`postcode` arrives as a number, not a string.** The service types it
  `esriFieldTypeInteger`, and binding a JS number into a `TEXT` column stores the
  stringified double — `'2304.0'` rather than `'2304'`, which silently breaks every
  exact comparison. The ingest coerces it to text before binding, and repairs older
  extracts in place when it opens the file, since a resumed run would never rewrite
  rows it thinks it already has.
- **The provider opens the database lazily**, not at boot, because the extract is
  usually written after the server is already running.

### Attribution

NSW Spatial Services data is published under Creative Commons Attribution 4.0.
A credit line is required wherever the data is surfaced.

### Limits we accepted

- **NSW only.** Interstate expansion needs the equivalent state service or G-NAF.
- **No typo tolerance.** FTS5 prefix matching handles `6 timm` but not `6 timins`.
  SQLite's trigram tokenizer would narrow this if it becomes a complaint.
- **Addresses only.** No landmark or POI search. A small hand-curated gazetteer
  of campuses and stations covers the common cases.

---

## Geoscape G-NAF — fallback address dataset

The authoritative national address file. **Not currently wired** — kept as the
fallback if NSW Spatial disappears, or when we expand interstate.

| | |
|---|---|
| Download | https://data.gov.au/data/dataset/geocoded-national-address-file-g-naf |
| Cost | Free |
| Licence | EULA based on CC BY 4.0, plus a restriction on mail use |
| Size | One national archive, ~5GB unpacked. No per-state download |
| Updates | Quarterly |
| Coverage | 15,901,249 addresses (May 2026 release) |

Chosen against for now purely on download size: NSW Spatial gives the same end
state — our own local index — for roughly 50MB of transfer instead of ~2GB.

Attribution if adopted:

> G-NAF © Geoscape Australia licensed by the Commonwealth of Australia under the
> Open Geo-coded National Address File (G-NAF) End User Licence Agreement.

Note the mail restriction: open G-NAF must not be used to compile addresses for
sending mail without verifying deliverability from a second source.

---

## Transport for NSW Open Data — journey times

**Not wired yet.** Intended source for real walk/bus/train times from a listing
to campus, replacing host-stated estimates.

| | |
|---|---|
| Portal | https://opendata.transport.nsw.gov.au |
| Docs | https://opendata.transport.nsw.gov.au/developers/documentation |
| Auth | Free API key — register, then Applications → Create Application |
| Cost | Free |
| Quota | Bronze plan: 60,000 requests/day, 5 requests/second |
| Endpoints | Trip Planner, Stop Finder, Departures, Service Alerts, Coordinate Request |

Over-rate requests return HTTP 403 with an `X-Error-Detail` header of
`Account Over Rate Limit`. The 5/second cap only matters for bulk backfill — an
agency feed of 500 properties becomes a background job of a few minutes.

Goes behind `server/transit.ts`, which returns `null` rather than a guessed
number and swallows outages so a routing failure can never block publishing.

### Alternatives if we leave NSW

Every state publishes GTFS. Either integrate each state's trip planner, or
self-host OpenTripPlanner across all their feeds, or pay for Google Routes API
(`TRANSIT` travel mode, $5 per 1,000 requests with 10,000 free monthly).

---

## Map tiles — Protomaps / OpenStreetMap

**Not wired yet.** For the map picker and map view.

Plan is MapLibre GL (BSD licensed, no vendor lock) reading a Protomaps `.pmtiles`
basemap. The entire basemap is a single static file read by the browser over HTTP
range requests — no tile server, no database, no API key. Extract just Australia
from Protomaps' daily planet builds and host it on object storage.

| | |
|---|---|
| Protomaps | https://protomaps.com/api — docs at https://docs.protomaps.com |
| Renderer | MapLibre GL JS |
| Cost | Storage + egress only; free tier hosting covers demo scale |

OpenStreetMap's public raster tiles are **not** an option — their usage policy
forbids production use. Attribution to OpenStreetMap contributors is required
either way.

Not available on this path: satellite imagery and Street View. Both are paid
Google or Mapbox products. Mapillary is a free crowd-sourced street-level
alternative with patchy Australian coverage.

---

## Considered and rejected

**Google Maps Platform.** Places Autocomplete per-session is genuinely free and
Routes API covers transit well, but its terms require deleting cached
coordinates after 30 days and displaying Places results on a Google map. That
collides directly with enrich-on-write, which depends on storing coordinates
permanently. Dynamic Maps is also the one SKU that scales with page views
(10,000 free, then $7 per 1,000) rather than with listings.

**Mapbox.** Clean licensing — Permanent Geocoding at $5 per 1,000 explicitly
allows permanent storage, and 50,000 free map loads monthly. The sensible paid
option if the free stack becomes a burden. Mapbox Directions does not do public
transport at all.

---

## Future: agency listing ingestion

Australian agencies already publish **REAXML**, the format REA Group invented
and every agency CRM exports (Console, PropertyMe, Rex, VaultRE, AgentBox).
Homely, Allhomes and Rent.com.au all ingest it.

REAXML carries `<inspectionTimes>` with start and end times per inspection,
which maps directly onto `InspectionAvailability` in `src/types/Inspection.ts`.
An agency integration is a config change on their side, not a workflow change.

---

## A note on the licence reading

The licence and terms summarised here were read as an engineer, not a lawyer.
The G-NAF EULA in particular layers extra restrictions on a CC BY 4.0 base. If
address or listing data becomes core to the business, get the terms reviewed
properly.
