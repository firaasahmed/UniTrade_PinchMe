// A nonce is the idempotency key for a charge. Same nonce = pinch returns the first
// result instead of taking the money twice.
//
// Derived, never generated: the same buyer paying the same deal for the same attempt
// always produces the same string, so a double-click, a refresh or a network retry
// all collapse onto one charge. A deliberate retry after a decline bumps `attempt`,
// which is what makes it a genuinely new charge.

export type NonceParts = {
  // the accepted deal, when there is one — otherwise the listing being bought
  subjectId: string;
  buyerId: string;
  // 1 for the first try, incremented only when the payer chooses to retry
  attempt: number;
};

// pinch caps a nonce at 250 chars; ours are far shorter, but keep the guard honest
const MAX = 250;

export function nonceFor({ subjectId, buyerId, attempt }: NonceParts): string {
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new Error(`attempt must be a positive integer, got ${attempt}`);
  }
  const nonce = `unitrade-${clean(subjectId)}-${clean(buyerId)}-attempt-${attempt}`;
  return nonce.length > MAX ? nonce.slice(0, MAX) : nonce;
}

// ids are ours and already tame, but a nonce has to survive being a plain string
function clean(part: string): string {
  return part.trim().replace(/[^A-Za-z0-9_-]/g, "-");
}
