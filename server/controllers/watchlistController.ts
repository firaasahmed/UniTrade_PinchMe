import type { Request, Response } from "express";
import * as watchlist from "../services/watchlistService.ts";
import { requireUser } from "../middleware/auth.ts";
import { param } from "../lib/http.ts";

// one bundle: ids for quick toggle state, listings for the watchlist page
export function get(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json({ ids: watchlist.watchlistIds(user.id), listings: watchlist.listWatchlist(user.id) });
}

export function add(req: Request, res: Response): void {
  const user = requireUser(req);
  watchlist.addWatch(user.id, param(req, "id"));
  res.status(204).end();
}

export function remove(req: Request, res: Response): void {
  const user = requireUser(req);
  watchlist.removeWatch(user.id, param(req, "id"));
  res.status(204).end();
}
