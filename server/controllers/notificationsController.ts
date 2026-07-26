import type { Request, Response } from "express";
import * as notifications from "../services/notificationsService.ts";
import { requireUser } from "../middleware/auth.ts";
import { param } from "../lib/http.ts";

export function list(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json(notifications.list(user.id));
}

export function unread(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json({ count: notifications.unreadCount(user.id) });
}

export function markRead(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json(notifications.markRead(user.id, param(req, "id")));
}

export function markAll(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json(notifications.markAllRead(user.id));
}
