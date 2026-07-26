import bcrypt from "bcryptjs";
import { repo } from "../data/index.ts";
import type { SessionUser } from "../../src/types/User.ts";
import { toSessionUser } from "./sessionService.ts";
import { signToken } from "../lib/jwt.ts";
import { ValidationError, UnauthorizedError } from "../lib/errors.ts";

export type RegisterInput = { name: string; email: string; password: string; location?: string };
export type AuthResult = { token: string; user: SessionUser };

const ROUNDS = 10;

// same bar as the rest of the sector: length, a digit, and a symbol
export function passwordProblem(password: string): string | undefined {
  if (password.length < 8) return "password must be at least 8 characters";
  if (!/\d/.test(password)) return "password must include at least one number";
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`';]/.test(password)) {
    return "password must include at least one special character";
  }
  return undefined;
}

function issue(user: Parameters<typeof toSessionUser>[0]): AuthResult {
  const session = toSessionUser(user);
  return { token: signToken({ sub: session.id, email: session.email, role: session.role }), user: session };
}

// the .edu.au domain check is what makes a student "verified" — that is the whole product
export function register(input: RegisterInput): AuthResult {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) throw new ValidationError("name is required");
  if (!email.includes("@")) throw new ValidationError("a valid email is required");

  const problem = passwordProblem(input.password);
  if (problem) throw new ValidationError(problem);

  const uni = repo.findUniversityByEmail(email);
  if (!uni) throw new ValidationError("use your university email — a recognised Australian .edu.au address");

  if (repo.getUserByEmail(email)) {
    throw new ValidationError("an account with this email already exists — sign in instead");
  }

  const user = repo.createUser(
    {
      name,
      email,
      universityId: uni.id,
      role: "student",
      location: input.location?.trim() || `${uni.city}, ${uni.state}`,
      lat: uni.lat,
      lng: uni.lng,
      verified: true,
    },
    bcrypt.hashSync(input.password, ROUNDS),
  );
  return issue(user);
}

export function login(email: string, password: string): AuthResult {
  const user = repo.getUserByEmail(email.trim().toLowerCase());
  const hash = user ? repo.getPasswordHash(user.id) : undefined;
  // one message for both misses, so this can't be used to discover who has an account
  if (!user || !hash || !bcrypt.compareSync(password, hash)) {
    throw new UnauthorizedError("invalid email or password");
  }
  return issue(user);
}

export function changePassword(userId: string, current: string, next: string): void {
  const hash = repo.getPasswordHash(userId);
  if (!hash || !bcrypt.compareSync(current, hash)) {
    throw new UnauthorizedError("current password is incorrect");
  }
  const problem = passwordProblem(next);
  if (problem) throw new ValidationError(problem);
  repo.setPasswordHash(userId, bcrypt.hashSync(next, ROUNDS));
}
