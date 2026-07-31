import type { Request, Response } from "express";
import { suggestAddresses, resolveAddress, manualPlace } from "../geo.ts";
import { param, queryString } from "../lib/http.ts";
import { NotFoundError } from "../lib/errors.ts";

export async function suggest(req: Request, res: Response): Promise<void> {
  const q = queryString(req.query.q) ?? "";
  res.json(await suggestAddresses(q));
}

export async function resolve(req: Request, res: Response): Promise<void> {
  const place = await resolveAddress(param(req, "id"));
  if (!place) throw new NotFoundError("address not found");
  res.json(place);
}

// hand-typed address — always succeeds, with a suburb point when we have one
export function manual(req: Request, res: Response): void {
  res.json(
    manualPlace({
      street: queryString(req.query.street) ?? "",
      suburb: queryString(req.query.suburb) ?? "",
      state: queryString(req.query.state) ?? "",
      postcode: queryString(req.query.postcode) ?? "",
    }),
  );
}
