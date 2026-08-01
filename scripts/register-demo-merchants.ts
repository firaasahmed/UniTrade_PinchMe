import "dotenv/config";
import { repo } from "../server/data/index.ts";
import { createManagedMerchant, hasCredentials } from "../server/payments/index.ts";
import type { MerchantRegistration } from "../src/types/Merchant.ts";

// Registers the demo sellers as managed merchants so a lease or a service can actually
// be paid for. Idempotent — anyone already registered is skipped, so re-running after a
// db:reset only fills the gaps.
//
//   npx tsx scripts/register-demo-merchants.ts

// everyone who actually has something listed — an unregistered seller can't be paid,
// so their listings show as not taking bookings. account numbers are derived from the
// user id so the same seed always produces the same details
function sellersWithListings(): string[] {
  const ids = new Set<string>();
  for (const l of repo.getListings({})) ids.add(l.sellerId);
  return [...ids].sort();
}

function payoutFor(userId: string): { bsb: string; account: string } {
  const digits = userId.replace(/\D/g, "").padStart(6, "0");
  return { bsb: "062000", account: `10${digits}` };
}

function splitName(name: string): { first: string; last: string } {
  const [first, ...rest] = name.trim().split(" ");
  return { first: first || "Contact", last: rest.join(" ") || "Team" };
}

async function main(): Promise<void> {
  if (!hasCredentials()) {
    console.error("No PINCH_APP_ID / PINCH_SECRET in .env — nothing to register against.");
    process.exitCode = 1;
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const userId of sellersWithListings()) {
    const payout = payoutFor(userId);
    const user = repo.getUser(userId);
    if (!user) {
      console.log(`${userId.padEnd(7)} —  no such user, skipped`);
      continue;
    }

    const existing = repo.getPinchMerchantId(userId);
    if (existing) {
      console.log(`${userId.padEnd(7)} ✓  ${user.name} already registered (${existing})`);
      skipped++;
      continue;
    }

    const { first, last } = splitName(user.name);
    const input: MerchantRegistration = {
      companyName: user.name,
      companyEmail: user.email,
      bankAccountRoutingNumber: payout.bsb,
      bankAccountNumber: payout.account,
      bankAccountName: user.name,
      contactFirstName: first,
      contactLastName: last,
    };

    try {
      const { merchantId } = await createManagedMerchant(input, {
        ipAddress: "127.0.0.1",
        userAgent: "unitrade-demo-seed",
      });
      repo.setPinchMerchantId(userId, merchantId);
      console.log(`${userId.padEnd(7)} +  ${user.name} → ${merchantId}`);
      created++;
    } catch (e) {
      console.error(`${userId.padEnd(7)} ✗  ${user.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n${created} registered, ${skipped} already had a merchant.`);
}

await main();
