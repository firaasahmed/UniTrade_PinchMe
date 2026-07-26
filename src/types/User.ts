import type { Listing } from "./Listing.ts";

export type UserRole = "admin" | "student";

export type User = {
  id: string;
  name: string;
  email: string;
  universityId: string;
  role: UserRole;
  // true when the email domain matches a known university
  verified: boolean;
  // set for organisational accounts (university housing offices, real estate agencies)
  orgType?: "university" | "agency";
  location: string;
  lat: number;
  lng: number;
  createdAt: string;
};

export type NewUser = {
  name: string;
  email: string;
  universityId: string;
  role: UserRole;
  location: string;
  lat: number;
  lng: number;
  verified?: boolean;
};

// safe projection embedded in listings, messages etc — never exposes email
export type PublicUser = {
  id: string;
  name: string;
  universityId: string;
  university: string;
  verified: boolean;
  orgType?: "university" | "agency";
};

// the signed-in user as the frontend sees themselves (GET /api/me)
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  universityId: string;
  university: string;
  location: string;
};

// a public profile: the safe user projection, join date, and their active listings
export type ProfileView = {
  user: PublicUser;
  joinedAt: string;
  // where they're based, shown as a tag on the profile
  location: string;
  listings: Listing[];
};

// fields the owner can change on their own account
export type UserPatch = {
  name?: string;
  location?: string;
};
