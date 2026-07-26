import jwt from "jsonwebtoken";
import { config } from "../config.ts";

export type TokenPayload = { sub: string; email: string; role: string };

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

// returns undefined for anything we can't trust — expired, tampered, wrong shape
export function verifyToken(token: string): TokenPayload | undefined {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (typeof decoded === "string") return undefined;
    const { sub, email, role } = decoded as Record<string, unknown>;
    if (typeof sub !== "string" || typeof email !== "string" || typeof role !== "string") {
      return undefined;
    }
    return { sub, email, role };
  } catch {
    return undefined;
  }
}

export function bearerFrom(header: string | undefined): string | undefined {
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice(7).trim() || undefined;
}
