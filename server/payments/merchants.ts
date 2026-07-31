import type { MerchantRegistration, MerchantView } from "../../src/types/Merchant.ts";
import { merchantStateFor } from "../../src/types/Merchant.ts";
import { pinchOk, isTestMode, type PinchBody } from "./client.ts";

// A managed merchant is a Pinch account we create *for* a seller, underneath ours.
// Payments made on their behalf settle to their own bank account and are not even
// readable from the parent account — which is what keeps UniTrade out of the money.

export type CreatedMerchant = { merchantId: string; view: MerchantView };

function readCompliance(body: PinchBody): MerchantView {
  const compliance = body["compliance"];
  const c = (compliance && typeof compliance === "object" ? compliance : {}) as PinchBody;
  const account = body["bankAccountNumber"];
  const notes = c["complianceOfficerNotes"] ?? c["merchantNotes"];

  return {
    state: merchantStateFor(
      { status: str(c["status"]), transactionsEnabled: c["transactionsEnabled"] === true },
      isTestMode(),
    ),
    merchantId: str(body["id"]),
    companyName: str(body["companyName"]),
    bankAccountTail: typeof account === "string" ? account.slice(-4) : undefined,
    transactionsEnabled: c["transactionsEnabled"] === true,
    settlementsEnabled: c["settlementsEnabled"] === true,
    notes: str(notes),
  };
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}

// ip and user agent are required — pinch records who submitted the registration
export async function createManagedMerchant(
  input: MerchantRegistration,
  origin: { ipAddress: string; userAgent: string },
): Promise<CreatedMerchant> {
  const body = await pinchOk("/merchants/managed", {
    method: "POST",
    body: {
      companyName: input.companyName,
      companyEmail: input.companyEmail,
      companyRegistrationNumber: input.companyRegistrationNumber || undefined,
      bankAccountRoutingNumber: input.bankAccountRoutingNumber,
      bankAccountNumber: input.bankAccountNumber,
      bankAccountName: input.bankAccountName,
      contacts: [
        {
          firstName: input.contactFirstName,
          lastName: input.contactLastName,
          email: input.companyEmail,
          contactType: "director",
          isPrimaryContact: true,
        },
      ],
      ipAddress: origin.ipAddress,
      userAgent: origin.userAgent,
    },
  });

  const merchantId = str(body["id"]);
  if (!merchantId) throw new Error("pinch did not return a merchant id");
  return { merchantId, view: readCompliance(body) };
}

// asked with the sub-merchant's own header, so we read their record and not ours
export async function getManagedMerchant(merchantId: string): Promise<MerchantView> {
  const body = await pinchOk("/merchants", { method: "GET", onBehalfOf: merchantId });
  return readCompliance(body);
}
