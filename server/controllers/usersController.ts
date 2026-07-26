import type { Request, Response } from "express";
import * as users from "../services/usersService.ts";
import { param } from "../lib/http.ts";

export function getProfile(req: Request, res: Response): void {
  res.json(users.getProfile(param(req, "id")));
}
