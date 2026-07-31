import type { Request, Response } from "express";
import * as deals from "../services/dealsService.ts";
import { requireUser } from "../middleware/auth.ts";
import { param, queryString } from "../lib/http.ts";
import type { DealKind, NewDeal } from "../../src/types/Deal.ts";

function asKind(v: unknown): DealKind | undefined {
  return v === "offer" || v === "quote" || v === "inspection" ? v : undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v.trim() || undefined : undefined;
}

export function list(req: Request, res: Response): void {
  const user = requireUser(req);
  const listingId = queryString(req.query.listingId);
  const otherUserId = queryString(req.query.otherUserId);
  if (listingId && otherUserId) {
    res.json(deals.listForThread(user, listingId, otherUserId));
    return;
  }
  res.json(deals.listForUser(user.id));
}

// "2026-08-02T10:00" or nothing — the service checks the slot is actually free
function slotStamp(v: unknown): string | undefined {
  const s = str(v)?.trim();
  return s && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? s : undefined;
}

export function create(req: Request, res: Response): void {
  const user = requireUser(req);
  const b = req.body as Record<string, unknown>;
  const kind = asKind(b.kind);
  if (!kind || typeof b.listingId !== "string") {
    res.status(400).json({ error: "listingId and a valid kind are required" });
    return;
  }
  const input: NewDeal & { buyerId?: string } = {
    listingId: b.listingId,
    kind,
    amountCents: typeof b.amountCents === "number" ? b.amountCents : undefined,
    scheduledFor: str(b.scheduledFor),
    scheduledAt: slotStamp(b.scheduledAt),
    note: str(b.note) ?? "",
  };
  if (typeof b.buyerId === "string") input.buyerId = b.buyerId;
  res.status(201).json(deals.createDeal(user, input));
}

export function accept(req: Request, res: Response): void {
  res.json(deals.acceptDeal(requireUser(req), param(req, "id")));
}

export function decline(req: Request, res: Response): void {
  res.json(deals.declineDeal(requireUser(req), param(req, "id")));
}

export function withdraw(req: Request, res: Response): void {
  res.json(deals.withdrawDeal(requireUser(req), param(req, "id")));
}

export function counter(req: Request, res: Response): void {
  res.json(reprice(req, deals.counterDeal));
}

export function revise(req: Request, res: Response): void {
  res.json(reprice(req, deals.reviseDeal));
}

type Reprice = (
  user: ReturnType<typeof requireUser>,
  id: string,
  amountCents: number | undefined,
  scheduledFor: string | undefined,
  note: string,
) => unknown;

function reprice(req: Request, fn: Reprice): unknown {
  const b = req.body as Record<string, unknown>;
  return fn(
    requireUser(req),
    param(req, "id"),
    typeof b.amountCents === "number" ? b.amountCents : undefined,
    str(b.scheduledFor),
    str(b.note) ?? "",
  );
}
