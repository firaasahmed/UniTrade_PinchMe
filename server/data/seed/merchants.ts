// Managed merchants already created for the seeded sellers, so a fresh database —
// local, or a Render instance that rebuilds on every boot — starts with sellers who
// can actually be paid. Without these nobody has a payout account and every item and
// service reads "not taking bookings yet".
//
// These are Pinch test-mode merchant ids, not credentials. Regenerate with
// `npm run merchants:demo` against a database that has none.
export const SEED_MERCHANTS: Record<string, string> = {
  usr2: "mch_c7EWnlKOkjNICT",
  usr3: "mch_B8L0i3kgQYgtQt",
  usr4: "mch_dcaOEDJsCvxjff",
  usr5: "mch_69EjaFcs8Hk5ZS",
  usr6: "mch_wdXxzAPddEv2LQ",
  usr7: "mch_lExMTWmrbhUl58",
  usr8: "mch_UgWPW4FAAD9M99",
  usr10: "mch_a5bMWmig4Qz3yY",
  usr11: "mch_GINTT0CTDPcxl2",
  usr12: "mch_kNq9aybimotLiU",
  usr13: "mch_ojGsHqSULfGR0w",
  usr14: "mch_dNhlCiOwxQqQAf",
  usr15: "mch_7qglCWbfxuOwvJ",
  usr16: "mch_cUCUy4CzJ4XVoK",
  usr17: "mch_7HSfrZU5R147mj",
  usr18: "mch_6TuEbFlw4DV4cN",
  usr19: "mch_RrUECCImn6O7uV",
  usr20: "mch_0OHCic6t7uLW53",
};
