import type { ListingKind } from "@/utils/categories";
import { categoryKind } from "@/utils/categories";

// Who may list what. One rulebook, imported by both the create form and the server,
// so the options you can see and the calls that succeed can never disagree.

export type Lister = {
  role: "admin" | "student";
  // set for agencies and university housing providers; absent for students
  orgType?: "university" | "agency";
  verified: boolean;
};

export type ListingRight =
  | { allowed: true }
  // why not, phrased for the person reading it
  | { allowed: false; reason: string };

const ORG_ONLY: ListingKind[] = ["accommodation"];

// a student is not a landlord. rooms come from agencies and university housing,
// which is also the only way the person taking the money has been checked
export function canList(user: Lister, kind: ListingKind): ListingRight {
  if (user.role === "admin") return { allowed: true };

  if (ORG_ONLY.includes(kind) && !user.orgType) {
    return {
      allowed: false,
      reason: "Accommodation is listed by real estate agencies and university housing providers.",
    };
  }

  if (!user.verified) {
    return { allowed: false, reason: "Verify your student email before you list anything." };
  }

  return { allowed: true };
}

export function kindsFor(user: Lister): ListingKind[] {
  const all: ListingKind[] = ["item", "service", "accommodation"];
  return all.filter((k) => canList(user, k).allowed);
}

// the same check from a saved listing's category, for the server's edit path
export function canListCategory(user: Lister, category: string): ListingRight {
  return canList(user, categoryKind(category));
}

// selling a service means being paid for it, so payouts have to be set up first.
// items are handed over in person and take no payment
export function needsPayoutAccount(kind: ListingKind): boolean {
  return kind === "service" || kind === "accommodation";
}
