import type { User } from "../../../src/types/User.ts";

// every seeded account shares one password: admin
// a fixed hash keeps the seed deterministic (bcrypt salts are random by design).
// it is deliberately weaker than the rules new signups face — these are throwaway
// demo logins, not accounts anyone should trust
export const SEED_PASSWORD_HASH = "$2b$10$kaBupPzAjwf2awDLNWs1iulpTnzG2eXUvmapT0A0DIQPWG7FaG1fW";

// fixed seed — the admin test account plus students across several universities
export const seedUsers: User[] = [
  { id: "usr1", name: "Admin", email: "admin@pinch.edu.au", universityId: "pinch", role: "admin", verified: true, location: "Sydney, NSW", lat: -33.8688, lng: 151.2093, createdAt: "2026-06-01T09:00:00.000Z" },
  { id: "usr2", name: "Priya S.", email: "priya.s@uon.edu.au", universityId: "uon", role: "student", verified: true, location: "Callaghan, NSW", lat: -32.8926, lng: 151.7057, createdAt: "2026-06-02T09:00:00.000Z" },
  { id: "usr3", name: "Daniel K.", email: "daniel.k@uon.edu.au", universityId: "uon", role: "student", verified: true, location: "Callaghan, NSW", lat: -32.8926, lng: 151.7057, createdAt: "2026-06-03T09:00:00.000Z" },
  { id: "usr4", name: "Marco L.", email: "marco.l@newcastle.edu.au", universityId: "uon", role: "student", verified: true, location: "Newcastle, NSW", lat: -32.9283, lng: 151.7817, createdAt: "2026-06-04T09:00:00.000Z" },
  { id: "usr5", name: "Aiko T.", email: "aiko.t@student.unsw.edu.au", universityId: "unsw", role: "student", verified: true, location: "Kensington, NSW", lat: -33.9173, lng: 151.2313, createdAt: "2026-06-05T09:00:00.000Z" },
  { id: "usr6", name: "Hannah W.", email: "hannah.w@sydney.edu.au", universityId: "usyd", role: "student", verified: true, location: "Camperdown, NSW", lat: -33.8886, lng: 151.1873, createdAt: "2026-06-06T09:00:00.000Z" },
  { id: "usr7", name: "Sam R.", email: "sam.r@student.unimelb.edu.au", universityId: "unimelb", role: "student", verified: true, location: "Parkville, VIC", lat: -37.7963, lng: 144.9614, createdAt: "2026-06-07T09:00:00.000Z" },
  { id: "usr8", name: "Grace O.", email: "grace.o@student.monash.edu", universityId: "monash", role: "student", verified: true, location: "Clayton, VIC", lat: -37.9105, lng: 145.1362, createdAt: "2026-06-08T09:00:00.000Z" },
  { id: "usr9", name: "Tom H.", email: "tom.h@uqconnect.edu.au", universityId: "uq", role: "student", verified: true, location: "St Lucia, QLD", lat: -27.4975, lng: 153.0137, createdAt: "2026-06-09T09:00:00.000Z" },
  { id: "usr10", name: "Nina P.", email: "nina.p@anu.edu.au", universityId: "anu", role: "student", verified: true, location: "Acton, ACT", lat: -35.2777, lng: 149.1185, createdAt: "2026-06-10T09:00:00.000Z" },
  { id: "usr11", name: "Leo M.", email: "leo.m@student.rmit.edu.au", universityId: "rmit", role: "student", verified: true, location: "Melbourne, VIC", lat: -37.8076, lng: 144.9635, createdAt: "2026-06-11T09:00:00.000Z" },
  { id: "usr12", name: "Omar F.", email: "omar.f@student.uts.edu.au", universityId: "uts", role: "student", verified: true, location: "Ultimo, NSW", lat: -33.883, lng: 151.199, createdAt: "2026-06-12T09:00:00.000Z" },
  { id: "usr13", name: "Ella B.", email: "ella.b@adelaide.edu.au", universityId: "adelaide", role: "student", verified: true, location: "Adelaide, SA", lat: -34.9205, lng: 138.6047, createdAt: "2026-06-13T09:00:00.000Z" },
  // organisational accounts — university housing office + partnered real estate agencies
  { id: "usr14", name: "UoN Student Living", email: "living@uon.edu.au", universityId: "uon", role: "student", verified: true, orgType: "university", location: "Callaghan, NSW", lat: -32.8926, lng: 151.7057, createdAt: "2026-06-14T09:00:00.000Z" },
  { id: "usr15", name: "Harbourline Property", email: "students@harbourline.com.au", universityId: "usyd", role: "student", verified: true, orgType: "agency", location: "Sydney, NSW", lat: -33.8886, lng: 151.1873, createdAt: "2026-06-15T09:00:00.000Z" },
  { id: "usr16", name: "Nest & Key Realty", email: "hello@nestandkey.com.au", universityId: "unimelb", role: "student", verified: true, orgType: "agency", location: "Melbourne, VIC", lat: -37.7963, lng: 144.9614, createdAt: "2026-06-16T09:00:00.000Z" },
  { id: "usr17", name: "Southbank Lets", email: "rentals@southbanklets.com.au", universityId: "uq", role: "student", verified: true, orgType: "agency", location: "Brisbane, QLD", lat: -27.4975, lng: 153.0137, createdAt: "2026-06-17T09:00:00.000Z" },
  // central coast hub — uon's ourimbah campus community
  { id: "usr18", name: "Jess N.", email: "jess.n@uon.edu.au", universityId: "uon", role: "student", verified: true, location: "Ourimbah, NSW", lat: -33.3608, lng: 151.3690, createdAt: "2026-06-18T09:00:00.000Z" },
  { id: "usr19", name: "Ryan D.", email: "ryan.d@newcastle.edu.au", universityId: "uon", role: "student", verified: true, location: "Gosford, NSW", lat: -33.4269, lng: 151.3428, createdAt: "2026-06-19T09:00:00.000Z" },
  { id: "usr20", name: "Central Coast Student Living", email: "living.cc@uon.edu.au", universityId: "uon", role: "student", verified: true, orgType: "university", location: "Ourimbah, NSW", lat: -33.3608, lng: 151.3690, createdAt: "2026-06-20T09:00:00.000Z" },
];
