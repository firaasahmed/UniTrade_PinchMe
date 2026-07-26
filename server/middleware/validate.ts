import type { Request, Response, NextFunction } from "express";

// runs a typed parser over the request body; the parser throws ValidationError on bad input
export function validateBody<T>(parse: (body: unknown) => T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
