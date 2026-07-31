import { nswAddressProvider } from "../server/geo/nswAddressProvider.ts";

// regression check for address matching — the failures found by hand, made repeatable
// npx tsx scripts/check-address-search.ts

type Case = {
  q: string;
  // the top hit must contain this; null means we expect nothing back on purpose
  expect: string | null;
  why: string;
};

const CASES: Case[] = [
  { q: "6 timmins st", expect: "6 TIMMINS ST", why: "baseline, abbreviated type" },
  { q: "6 timmins street", expect: "6 TIMMINS ST", why: "full street type" },
  { q: "university drive", expect: "UNIVERSITY DR", why: "full type, no number" },
  { q: "university dr", expect: "UNIVERSITY DR", why: "abbreviated type" },
  { q: "sandgate road", expect: "SANDGATE RD", why: "full type must outrank oddities" },
  { q: "sandgate rd", expect: "SANDGATE RD", why: "abbreviated type" },
  { q: "birmingham gardens", expect: "BIRMINGHAM GARDENS", why: "suburb in full" },
  { q: "birmingham gdns", expect: "BIRMINGHAM GARDENS", why: "abbreviated suburb" },
  { q: "north lambton", expect: "NORTH LAMBTON", why: "suburb in full" },
  { q: "nth lambton", expect: "NORTH LAMBTON", why: "abbreviated suburb" },
  { q: "5 king st ourimbah", expect: "5 KING ST, OURIMBAH", why: "street plus suburb" },
  { q: "ourimbah 2258", expect: "OURIMBAH NSW 2258", why: "suburb plus postcode" },
  { q: "11 coronation waratah", expect: "11 CORONATION ST, WARATAH WEST", why: "type omitted entirely" },
  { q: "130 university dr callaghan", expect: "130 UNIVERSITY DR, CALLAGHAN", why: "full address" },
  { q: "bourke st carrington", expect: "BOURKE ST, CARRINGTON", why: "street plus suburb" },
  { q: "callagan", expect: "CALLAGHAN", why: "one edit, only one candidate" },
  { q: "waratha west", expect: "WARATAH WEST", why: "transposition, only one candidate" },
  // "timins" is a real street (Thomas Timins Pl), so this is not a typo at all
  { q: "6 timins st", expect: "TIMINS", why: "a real street, never corrected away" },
  // refusing to guess is the point — timmns sits one edit from timmins AND timins
  { q: "6 timmns st", expect: null, why: "ambiguous, must not pick the popular one" },
  { q: "sandgait rd", expect: null, why: "two edits away, too far to be a correction" },
  { q: "sandgate rd shortland", expect: "SANDGATE RD, SHORTLAND", why: "disambiguated by suburb" },
  { q: "2 bolton newcastle", expect: "BOLTON ST, NEWCASTLE", why: "type omitted, suburb given" },
  { q: "wallace st islington", expect: "WALLACE ST, ISLINGTON", why: "street plus suburb" },
];

async function main(): Promise<void> {
  let passed = 0;
  const failures: string[] = [];

  for (const c of CASES) {
    const hits = await nswAddressProvider.suggest(c.q, 5);
    const top = hits[0]?.label ?? "";

    if (c.expect === null) {
      // refusing to answer is the expected behaviour here
      if (hits.length === 0) {
        passed++;
        console.log(`  PASS  ${c.q}  (correctly returned nothing)`);
      } else {
        console.log(`  FAIL  ${c.q}  — expected nothing, got "${top}"`);
        failures.push(`${c.q} (${c.why})`);
      }
      continue;
    }

    const want = c.expect.toUpperCase();
    const anywhere = hits.findIndex((h) => h.label.toUpperCase().includes(want));

    if (top.toUpperCase().includes(want)) {
      passed++;
      console.log(`  PASS  ${c.q}`);
    } else {
      const detail =
        hits.length === 0
          ? "no results"
          : anywhere > 0
            ? `wanted at rank ${anywhere + 1}, top was "${top}"`
            : `top was "${top}"`;
      console.log(`  FAIL  ${c.q}  — ${detail}`);
      failures.push(`${c.q} (${c.why})`);
    }
  }

  console.log(`\n${passed}/${CASES.length} passing`);
  if (failures.length > 0) {
    console.log("\nfailing:");
    for (const f of failures) console.log(`  - ${f}`);
  }
}

void main();
