import type { Request, Response } from "express";
import * as checkoutService from "../services/checkoutService.ts";
import { requireUser } from "../middleware/auth.ts";
import { AppError } from "../lib/errors.ts";

// hands back the pinch hosted checkout url for the browser to redirect to
export async function startLink(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const body = req.body as { listingId?: unknown; dealId?: unknown };
  if (typeof body.listingId !== "string") {
    res.status(400).json({ error: "listingId is required" });
    return;
  }
  const origin = req.header("origin") ?? `${req.protocol}://${req.get("host") ?? ""}`;
  res.json(
    await checkoutService.startHostedCheckout(
      user,
      body.listingId,
      typeof body.dealId === "string" ? body.dealId : undefined,
      origin,
    ),
  );
}

// the payer is back from pinch; confirm with pinch and settle
export async function confirmLink(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const body = req.body as { listingId?: unknown; dealId?: unknown; paymentId?: unknown };
  if (typeof body.listingId !== "string" || typeof body.paymentId !== "string") {
    res.status(400).json({ error: "listingId and paymentId are required" });
    return;
  }
  res.json(
    await checkoutService.confirmHostedCheckout(
      user,
      body.listingId,
      typeof body.dealId === "string" ? body.dealId : undefined,
      body.paymentId,
    ),
  );
}

type CheckoutBody = {
  token?: unknown;
  listingId?: unknown;
  fullName?: unknown;
  email?: unknown;
  description?: unknown;
  dealId?: unknown;
};

// preserves the proven checkout contract: 400 on missing fields, 404 on unknown listing,
// 502 on a pinch request-level failure, otherwise the mapped CheckoutResult
export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CheckoutBody;

  if (typeof body.token !== "string" || typeof body.listingId !== "string") {
    res.status(400).json({ error: "token and listingId are required" });
    return;
  }

  try {
    const result = await checkoutService.checkout(
      {
        token: body.token,
        listingId: body.listingId,
        fullName: typeof body.fullName === "string" ? body.fullName : undefined,
        email: typeof body.email === "string" ? body.email : undefined,
        description: typeof body.description === "string" ? body.description : undefined,
        dealId: typeof body.dealId === "string" ? body.dealId : undefined,
      },
      req.user?.id,
    );
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    // request-level failure (bad token, validation, network) — not a mapped payment outcome
    res.status(502).json({ error: err instanceof Error ? err.message : "checkout failed" });
  }
}
