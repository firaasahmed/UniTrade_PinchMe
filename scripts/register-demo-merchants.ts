import "dotenv/config";
import { repo } from "../server/data/index.ts";
import { createManagedMerchant, hasCredentials } from "../server/payments/index.ts";
import type { MerchantRegistration } from "../src/types/Merchant.ts";

// Registers the demo sellers as managed merchants so a lease or a service can actually
// be paid for. Idempotent — anyone already registered is skipped, so re-running after a
// db:reset only fills the gaps.
//
//   npx tsx scripts/register-demo-merchants.ts

// fixed payout details per seller. deterministic, like the rest of the seed —
// test BSB and account numbers, never real ones
const PAYOUTS: Record<string, { bsb: string; account: string }> = {
  usr14: { bsb: "062000", account: "10000014" },
  usr15: { bsb: "062000", account: "10000015" },
  usr16: { bsb: "062000", account: "10000016" },
  usr17: { bsb: "062000", account: "10000017" },
  usr20: { bsb: "062000", account: "10000020" },
  // the two students who sell services, so the services flow is demoable
  usr3: { bsb: "062000", account: "10000003" },
  usr4: { bsb: "062000", account: "10000004" },
};

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

  for (const [userId, payout] of Object.entries(PAYOUTS)) {
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
