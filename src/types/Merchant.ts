// A seller who can be paid. UniTrade never receives their money — Pinch settles it
// straight to their own bank account, so the platform is never a party to the funds.

// pinch's own compliance status, verbatim from the merchant record
export type ComplianceStatus = "new" | "pending" | "in-review" | "approved" | "rejected";

// exactly one of these, derived from the compliance block. every backend shape maps
// to one state the ui knows how to render
export type MerchantState =
  | "not-registered"
  | "submitted"
  | "in-review"
  | "ready"
  | "rejected";

export type MerchantView = {
  state: MerchantState;
  // pinch merchant id, present from the moment registration succeeds
  merchantId?: string;
  companyName?: string;
  // last four of the payout account, so a host can confirm it without us echoing it
  bankAccountTail?: string;
  // pinch's own flags, surfaced for the status screen rather than interpreted in the ui
  transactionsEnabled: boolean;
  settlementsEnabled: boolean;
  // why a rejection happened, straight from the compliance officer
  notes?: string;
};

// what registration collects. no card details ever — this is where money goes, not comes from
export type MerchantRegistration = {
  companyName: string;
  companyEmail: string;
  // ABN, optional for a sole trader who does not have one yet
  companyRegistrationNumber?: string;
  // BSB, six digits, no separator
  bankAccountRoutingNumber: string;
  bankAccountNumber: string;
  bankAccountName: string;
  contactFirstName: string;
  contactLastName: string;
};

const READY: ComplianceStatus[] = ["approved"];

// in test mode pinch accepts payments before approval, so a created merchant is
// usable immediately. live mode gates on approved — one flag, one place
export function merchantStateFor(
  compliance: { status?: string; transactionsEnabled?: boolean } | undefined,
  testMode: boolean,
): MerchantState {
  if (!compliance?.status) return "not-registered";
  const status = compliance.status as ComplianceStatus;
  if (status === "rejected") return "rejected";
  if (READY.includes(status) || compliance.transactionsEnabled === true) return "ready";
  if (testMode) return "ready";
  if (status === "in-review" || status === "pending") return "in-review";
  return "submitted";
}

export function canBePaid(state: MerchantState): boolean {
  return state === "ready";
}
