import type { Request, Response } from "express";
import * as universities from "../services/universitiesService.ts";
import { param } from "../lib/http.ts";

export function list(_req: Request, res: Response): void {
  res.json(universities.listUniversities());
}

export function getOne(req: Request, res: Response): void {
  res.json(universities.getUniversity(param(req, "id")));
}
