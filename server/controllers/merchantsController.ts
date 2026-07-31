import type { Request, Response } from "express";
import { merchantFor, register } from "../services/merchantsService.ts";
import type { MerchantRegistration } from "../../src/types/Merchant.ts";
import { requireUser } from "../middleware/auth.ts";

export async function mine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  res.json(await merchantFor(user.id));
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// digits only — a pasted BSB often arrives as "062-000"
function digits(v: unknown): string {
  return typeof v === "string" ? v.replace(/\D/g, "") : "";
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const b = req.body as Record<string, unknown>;

  const input: MerchantRegistration = {
    companyName: str(b.companyName),
    companyEmail: str(b.companyEmail) || user.email,
    companyRegistrationNumber: digits(b.companyRegistrationNumber) || undefined,
    bankAccountRoutingNumber: digits(b.bankAccountRoutingNumber),
    bankAccountNumber: digits(b.bankAccountNumber),
    bankAccountName: str(b.bankAccountName),
    contactFirstName: str(b.contactFirstName),
    contactLastName: str(b.contactLastName),
  };

  // pinch records who submitted the registration, so pass the real client through
  const view = await register(user.id, input, {
    ipAddress: req.ip ?? "0.0.0.0",
    userAgent: req.get("user-agent") ?? "unknown",
  });
  res.status(201).json(view);
}
