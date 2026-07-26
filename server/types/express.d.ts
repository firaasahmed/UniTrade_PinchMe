import type { User } from "../../src/types/User.ts";

// the auth seam attaches the signed-in user here
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
