// money is cents everywhere; dollars only exist at the edges of a form
export function toCents(dollars: string): number | undefined {
  const n = Number.parseFloat(dollars);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
}

// same, but zero is a legitimate price (a free listing, a draft)
export function toCentsAllowingZero(dollars: string): number | undefined {
  const n = Number.parseFloat(dollars);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
}

export function toInt(v: string): number | undefined {
  const n = Number.parseInt(v, 10);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

export function toDollars(cents: number): string {
  return (cents / 100).toString();
}
