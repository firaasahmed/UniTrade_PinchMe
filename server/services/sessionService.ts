import { repo } from "../data/index.ts";
import type { User, SessionUser, UserPatch } from "../../src/types/User.ts";
import { NotFoundError, ValidationError } from "../lib/errors.ts";

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    verified: user.verified,
    universityId: user.universityId,
    university: repo.getUniversity(user.universityId)?.name ?? "",
    location: user.location,
  };
}

// owner edits their own name/location — email + university stay fixed (verification anchor)
export function updateMe(user: User, patch: UserPatch): SessionUser {
  const clean: UserPatch = {};
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new ValidationError("name cannot be empty");
    clean.name = name;
  }
  if (patch.location !== undefined) clean.location = patch.location.trim();

  const updated = repo.updateUser(user.id, clean);
  if (!updated) throw new NotFoundError("user not found");
  return toSessionUser(updated);
}
