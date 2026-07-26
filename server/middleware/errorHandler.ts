import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.ts";

// centralised — AppError carries its own status, anything else is a 500
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("unhandled error:", err);
  res.status(500).json({ error: "internal server error" });
}
