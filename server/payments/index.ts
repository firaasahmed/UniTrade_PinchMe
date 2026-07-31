// The payments module. Nothing outside this folder talks to Pinch — the rest of the
// server imports from here and nowhere else. See README.md for the security model.

export { hasCredentials, verifyCredentials, PinchUnreachableError } from "./client.ts";

export {
  createRealtimePayment,
  createPaymentLink,
  getPayment,
  createRefund,
  findByNonce,
  quoteFees,
  savePayer,
  type RealtimePaymentInput,
  type PaymentLinkInput,
  type PaymentMetadata,
  type PayerInput,
  type FeeQuote,
  type SourceType,
} from "./operations.ts";

export {
  createManagedMerchant,
  getManagedMerchant,
  type CreatedMerchant,
} from "./merchants.ts";

export { nonceFor, type NonceParts } from "./nonce.ts";

export { verifyWebhook, type WebhookVerdict } from "./webhook.ts";
