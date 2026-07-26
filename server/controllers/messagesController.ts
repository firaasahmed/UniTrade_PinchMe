import type { Request, Response } from "express";
import * as messages from "../services/messagesService.ts";
import { requireUser } from "../middleware/auth.ts";
import { queryString } from "../lib/http.ts";

export function list(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json(messages.listConversations(user.id));
}

export function unread(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json({ count: messages.unreadCount(user.id) });
}

export function thread(req: Request, res: Response): void {
  const user = requireUser(req);
  const listingId = queryString(req.query.listingId);
  const otherUserId = queryString(req.query.otherUserId);
  if (!listingId || !otherUserId) {
    res.status(400).json({ error: "listingId and otherUserId are required" });
    return;
  }
  res.json(messages.getThread(user.id, listingId, otherUserId));
}

export function send(req: Request, res: Response): void {
  const user = requireUser(req);
  const body = req.body as { listingId?: unknown; recipientId?: unknown; body?: unknown };
  if (typeof body.listingId !== "string" || typeof body.recipientId !== "string" || typeof body.body !== "string") {
    res.status(400).json({ error: "listingId, recipientId and body are required" });
    return;
  }
  res.status(201).json(messages.send(user.id, body.listingId, body.recipientId, body.body));
}
