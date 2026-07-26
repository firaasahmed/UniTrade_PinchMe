import type { BrandDeal } from "@/types/BrandDeal";
import { apiFetch } from "@/lib/api";

// the code is withheld server-side until you're a verified student
export type BrandDealView = Omit<BrandDeal, "code"> & { code: string | null; locked: boolean };

export async function getBrandDeals(): Promise<BrandDealView[]> {
  const res = await apiFetch("/api/brand-deals");
  if (!res.ok) throw new Error(`failed to load deals (${res.status})`);
  return (await res.json()) as BrandDealView[];
}
