import { repo } from "../data/index.ts";
import type { University } from "../../src/types/University.ts";
import { NotFoundError } from "../lib/errors.ts";

export function listUniversities(): University[] {
  return repo.getUniversities();
}

export function getUniversity(id: string): University {
  const uni = repo.getUniversity(id);
  if (!uni) throw new NotFoundError("university not found");
  return uni;
}
