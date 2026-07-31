import { repo } from "../data/index.ts";
import { createManagedMerchant, getManagedMerchant } from "../payments/index.ts";
import type { MerchantRegistration, MerchantView } from "../../src/types/Merchant.ts";
import type { ListingRow } from "../../src/types/Listing.ts";
import { canBePaid } from "../../src/types/Merchant.ts";
import { ValidationError, ForbiddenError } from "../lib/errors.ts";

const NOT_REGISTERED: MerchantView = {
  state: "not-registered",
  transactionsEnabled: false,
  settlementsEnabled: false,
};

// ALL the platform fee rules live here. one function, so the number on the screen and
// the number in the charge can never disagree
export function platformFeeCents(listing: ListingRow, amountCents: number): number {
  const category = listing.category.toLowerCase();
  // a lease placement is a flat fee to the agency, not a slice of the student's money
  if (category === "accommodation") return 3000;
  // services take a small percentage, rounded down so we never over-collect
  if (category === "services") return Math.floor(amountCents * 0.05);
  return 0;
}

export async function merchantFor(userId: string): Promise<MerchantView> {
  const merchantId = repo.getPinchMerchantId(userId);
  if (!merchantId) return NOT_REGISTERED;
  try {
    return await getManagedMerchant(merchantId);
  } catch {
    // pinch unreachable — we still know they registered, we just can't read the status
    return { ...NOT_REGISTERED, state: "submitted", merchantId };
  }
}

function requireFields(input: MerchantRegistration): void {
  const missing: string[] = [];
  if (!input.companyName?.trim()) missing.push("business name");
  if (!input.companyEmail?.trim()) missing.push("business email");
  if (!input.bankAccountName?.trim()) missing.push("account name");
  if (!/^\d{6}$/.test(input.bankAccountRoutingNumber ?? "")) missing.push("a six digit BSB");
  if (!/^\d{3,9}$/.test(input.bankAccountNumber ?? "")) missing.push("an account number");
  if (!input.contactFirstName?.trim() || !input.contactLastName?.trim()) missing.push("a contact name");
  if (missing.length > 0) throw new ValidationError(`registration needs ${missing.join(", ")}`);
}

export async function register(
  userId: string,
  input: MerchantRegistration,
  origin: { ipAddress: string; userAgent: string },
): Promise<MerchantView> {
  if (repo.getPinchMerchantId(userId)) {
    throw new ValidationError("this account is already registered to be paid");
  }
  requireFields(input);

  const { merchantId, view } = await createManagedMerchant(input, origin);
  repo.setPinchMerchantId(userId, merchantId);
  return view;
}

// the guardrail: nobody can be charged for a listing whose seller has nowhere to be paid
export async function payoutGuard(listing: ListingRow): Promise<string> {
  const merchant = await merchantFor(listing.sellerId);
  if (!canBePaid(merchant.state)) {
    throw new ForbiddenError("this seller hasn't finished setting up payouts yet");
  }
  const merchantId = merchant.merchantId;
  if (!merchantId) throw new ForbiddenError("this seller hasn't finished setting up payouts yet");
  return merchantId;
}
