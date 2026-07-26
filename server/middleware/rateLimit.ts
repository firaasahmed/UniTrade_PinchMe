import type { Request, Response, NextFunction } from "express";

type Hit = { count: number; resetAt: number };

// small in-memory limiter — enough to stop password guessing on a single instance.
// a multi-instance deploy wants redis behind the same signature
export function rateLimit(options: { windowMs: number; max: number; message: string }) {
  const hits = new Map<string, Hit>();

  return function limiter(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    const hit = hits.get(key);

    if (!hit || now > hit.resetAt) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    hit.count++;
    if (hit.count > options.max) {
      res.status(429).json({ error: options.message });
      return;
    }
    next();
  };
}
