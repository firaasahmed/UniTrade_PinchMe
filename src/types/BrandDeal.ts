// a student discount from a partner brand — the affiliate revenue line
export type BrandLogo = "circle" | "square" | "triangle" | "diamond" | "ring" | "bolt";

export type BrandDeal = {
  id: string;
  brand: string;
  tagline: string;
  category: string;
  discount: string;
  code: string;
  // tailwind class for the tile behind the mark
  tile: string;
  logo: BrandLogo;
  url: string;
};
