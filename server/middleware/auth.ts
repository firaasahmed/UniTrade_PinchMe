import type { Request, Response, NextFunction } from "express";
import { repo } from "../data/index.ts";
import { UnauthorizedError } from "../lib/errors.ts";
import { verifyToken, bearerFrom } from "../lib/jwt.ts";
import type { User } from "../../src/types/User.ts";

// a valid bearer token attaches the user; anything else is simply anonymous
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const token = bearerFrom(req.header("authorization"));
  if (!token) return next();
  const payload = verifyToken(token);
  if (!payload) return next();
  const user = repo.getUser(payload.sub);
  if (user) req.user = user;
  next();
}

export function requireUser(req: Request): User {
  if (!req.user) throw new UnauthorizedError("sign in required");
  return req.user;
}
