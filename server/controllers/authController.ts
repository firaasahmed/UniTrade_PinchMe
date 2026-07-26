import type { Request, Response } from "express";
import * as authService from "../services/authService.ts";
import { requireUser } from "../middleware/auth.ts";
import { ValidationError } from "../lib/errors.ts";

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export function register(req: Request, res: Response): void {
  const b = req.body as Record<string, unknown>;
  const name = str(b.name);
  const email = str(b.email);
  const password = str(b.password);
  if (!name || !email || !password) throw new ValidationError("name, email and password are required");
  res.status(201).json(authService.register({ name, email, password, location: str(b.location) }));
}

export function login(req: Request, res: Response): void {
  const b = req.body as Record<string, unknown>;
  const email = str(b.email);
  const password = str(b.password);
  if (!email || !password) throw new ValidationError("email and password are required");
  res.json(authService.login(email, password));
}

export function changePassword(req: Request, res: Response): void {
  const user = requireUser(req);
  const b = req.body as Record<string, unknown>;
  const current = str(b.currentPassword);
  const next = str(b.newPassword);
  if (!current || !next) throw new ValidationError("currentPassword and newPassword are required");
  authService.changePassword(user.id, current, next);
  res.status(204).end();
}
