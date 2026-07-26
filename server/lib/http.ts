import type { Request } from "express";
import { NotFoundError } from "./errors.ts";

// route params are declared, but read them safely under noUncheckedIndexedAccess
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string") throw new NotFoundError(`missing route param ${name}`);
  return value;
}

export function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}
