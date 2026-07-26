import type { Request, Response } from "express";
import * as brandDeals from "../services/brandDealsService.ts";

export function list(req: Request, res: Response): void {
  res.json(brandDeals.list(req.user?.verified === true));
}
