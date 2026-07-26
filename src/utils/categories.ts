import {
  Sofa,
  Laptop,
  BookOpen,
  CookingPot,
  Home,
  Handshake,
  Bike,
  Shirt,
  Package,
  MonitorSmartphone,
  type LucideIcon,
} from "lucide-react";

// display order for the filter chips
export const KNOWN_CATEGORIES = [
  "Laptops",
  "Furniture",
  "Electronics",
  "Textbooks",
  "Kitchen",
  "Accommodation",
  "Services",
  "Transport",
  "Clothing",
  "Other",
] as const;

// known categories get an icon; anything else falls back to Package
const ICONS: Record<string, LucideIcon> = {
  laptops: Laptop,
  furniture: Sofa,
  electronics: MonitorSmartphone,
  textbooks: BookOpen,
  kitchen: CookingPot,
  accommodation: Home,
  services: Handshake,
  transport: Bike,
  clothing: Shirt,
};

export function categoryIcon(category: string): LucideIcon {
  return ICONS[category.toLowerCase()] ?? Package;
}

// the three top-level tabs — accommodation and services behave differently to items
export type ListingKind = "item" | "service" | "accommodation";

export const KINDS: { value: ListingKind; label: string }[] = [
  { value: "item", label: "Items" },
  { value: "service", label: "Services" },
  { value: "accommodation", label: "Accommodation" },
];

// the categories that live under the Items tab (chips)
export const ITEM_CATEGORIES = [
  "Laptops",
  "Electronics",
  "Furniture",
  "Textbooks",
  "Kitchen",
  "Transport",
  "Clothing",
  "Other",
];

export function categoryKind(category: string): ListingKind {
  const c = category.toLowerCase();
  if (c === "accommodation") return "accommodation";
  if (c === "services") return "service";
  return "item";
}

export function isListingKind(v: string | null): v is ListingKind {
  return v === "item" || v === "service" || v === "accommodation";
}

// the fixed category a kind implies; items pick their own
export function categoryForKind(kind: ListingKind): string {
  return kind === "service" ? "Services" : kind === "accommodation" ? "Accommodation" : "";
}

// per-kind colour so items/services/accommodation read differently at a glance
// item = navy (primary), service = teal (verified), accommodation = gold
export type KindAccent = {
  label: string;
  text: string;
  badge: string;
  ring: string;
  hoverRing: string;
  dot: string;
};

// full literal class strings so tailwind's scanner picks them up (no dynamic composition)
const ACCENTS: Record<ListingKind, KindAccent> = {
  item: {
    label: "Item",
    text: "text-primary",
    badge: "bg-primary/10 text-primary",
    ring: "ring-primary/25",
    hoverRing: "hover:ring-primary/25",
    dot: "bg-primary",
  },
  service: {
    label: "Service",
    text: "text-verified",
    badge: "bg-verified/12 text-verified",
    ring: "ring-verified/25",
    hoverRing: "hover:ring-verified/25",
    dot: "bg-verified",
  },
  accommodation: {
    label: "Accommodation",
    text: "text-gold-foreground",
    badge: "bg-gold/20 text-gold-foreground",
    ring: "ring-gold/40",
    hoverRing: "hover:ring-gold/40",
    dot: "bg-gold",
  },
};

export function kindAccent(kind: ListingKind): KindAccent {
  return ACCENTS[kind];
}
