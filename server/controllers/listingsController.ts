import type { Request, Response } from "express";
import * as listings from "../services/listingsService.ts";
import { calendarFor } from "../services/inspectionsService.ts";
import { systemClock } from "../lib/clock.ts";
import { requireUser } from "../middleware/auth.ts";
import { param, queryString } from "../lib/http.ts";
import type { ListingFilter, NewListing, ListingPatch } from "../../src/types/Listing.ts";

export function list(req: Request, res: Response): void {
  const filter: ListingFilter = {
    category: queryString(req.query.category),
    universityId: queryString(req.query.universityId),
    city: queryString(req.query.city),
  };
  res.json(listings.listListings(filter));
}

export function getOne(req: Request, res: Response): void {
  res.json(listings.getListingView(param(req, "id")));
}

export function inspections(req: Request, res: Response): void {
  res.json(calendarFor(param(req, "id"), systemClock().slice(0, 10)));
}

export function mine(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json(listings.listUserListings(user.id));
}

export function create(req: Request, res: Response): void {
  const user = requireUser(req);
  res.status(201).json(listings.createListing(user, req.body as NewListing));
}

export function update(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json(listings.updateListing(user, param(req, "id"), req.body as ListingPatch));
}

export function markSold(req: Request, res: Response): void {
  const user = requireUser(req);
  res.json(listings.markSold(user, param(req, "id")));
}

export function remove(req: Request, res: Response): void {
  const user = requireUser(req);
  listings.deleteListing(user, param(req, "id"));
  res.status(204).end();
}
