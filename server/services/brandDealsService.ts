import { repo } from "../data/index.ts";
import type { BrandDeal } from "../../src/types/BrandDeal.ts";

// the discount code only goes out to a verified student — that gating is the product
export type BrandDealView = Omit<BrandDeal, "code"> & { code: string | null; locked: boolean };

export function list(viewerVerified: boolean): BrandDealView[] {
  return repo.getBrandDeals().map((d) => ({
    ...d,
    code: viewerVerified ? d.code : null,
    locked: !viewerVerified,
  }));
}
