import type { BrandDeal } from "../../../src/types/BrandDeal.ts";

// illustrative partner deals — fictional brands, fixed data, mock codes.
// real affiliate integrations (UNiDAYS-style) come later; this shows the surface
export const seedBrandDeals: BrandDeal[] = [
  { id: "bd1", brand: "Orange", tagline: "Laptops & tablets for study", category: "Tech", discount: "15% off", code: "UNI-ORANGE15", tile: "bg-orange-500", logo: "circle", url: "https://example.com/orange" },
  { id: "bd2", brand: "Chapter One", tagline: "Textbooks, new & used", category: "Books", discount: "20% off", code: "UNI-CHPT20", tile: "bg-primary", logo: "square", url: "https://example.com/chapter-one" },
  { id: "bd3", brand: "Peak Fitness", tagline: "Campus-adjacent gyms", category: "Health", discount: "30% off", code: "UNI-PEAK30", tile: "bg-verified", logo: "triangle", url: "https://example.com/peak" },
  { id: "bd4", brand: "Brew & Co", tagline: "Coffee near every campus", category: "Food", discount: "Buy 1 get 1", code: "UNI-BREWBOGO", tile: "bg-amber-700", logo: "ring", url: "https://example.com/brew" },
  { id: "bd5", brand: "Nimbus Mobile", tagline: "Student SIM plans", category: "Telco", discount: "25% off", code: "UNI-NIMBUS25", tile: "bg-sky-600", logo: "bolt", url: "https://example.com/nimbus" },
  { id: "bd6", brand: "Metro Threads", tagline: "Everyday basics", category: "Fashion", discount: "10% off", code: "UNI-METRO10", tile: "bg-rose-600", logo: "diamond", url: "https://example.com/metro" },
  { id: "bd7", brand: "PedalWorks", tagline: "Bikes, service & parts", category: "Transport", discount: "12% off", code: "UNI-PEDAL12", tile: "bg-emerald-700", logo: "circle", url: "https://example.com/pedalworks" },
  { id: "bd8", brand: "Nightowl Eats", tagline: "Late-night delivery", category: "Food", discount: "Free delivery", code: "UNI-OWLFREE", tile: "bg-violet-600", logo: "square", url: "https://example.com/nightowl" },
];
