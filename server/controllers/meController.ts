import type { Request, Response } from "express";
import { requireUser } from "../middleware/auth.ts";
import { toSessionUser, updateMe } from "../services/sessionService.ts";
import * as bookings from "../services/bookingsService.ts";
import { param } from "../lib/http.ts";
import type { UserPatch } from "../../src/types/User.ts";

export function me(req: Request, res: Response): void {
  res.json(toSessionUser(requireUser(req)));
}

export function update(req: Request, res: Response): void {
  const user = requireUser(req);
  const body = req.body as { name?: unknown; location?: unknown };
  const patch: UserPatch = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.location === "string") patch.location = body.location;
  res.json(updateMe(user, patch));
}

export function purchases(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json(bookings.listPurchases(user.id));
}

export function sales(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json(bookings.listSales(user.id));
}

export async function refundPurchase(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  res.json(await bookings.refundBooking(user, param(req, "id")));
}

export function confirmPurchase(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json(bookings.confirmReceived(user, param(req, "id")));
}
