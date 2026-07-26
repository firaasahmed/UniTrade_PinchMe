import type { University } from "../../../src/types/University.ts";

// fixed seed — real australian universities, stable ids
export const seedUniversities: University[] = [
  { id: "uon", name: "University of Newcastle", emailDomains: ["uon.edu.au", "newcastle.edu.au"], city: "Newcastle", state: "NSW", lat: -32.8926, lng: 151.7057 },
  { id: "usyd", name: "University of Sydney", emailDomains: ["sydney.edu.au", "uni.sydney.edu.au"], city: "Sydney", state: "NSW", lat: -33.8886, lng: 151.1873 },
  { id: "unsw", name: "UNSW Sydney", emailDomains: ["unsw.edu.au", "student.unsw.edu.au", "ad.unsw.edu.au"], city: "Sydney", state: "NSW", lat: -33.9173, lng: 151.2313 },
  { id: "uts", name: "University of Technology Sydney", emailDomains: ["uts.edu.au", "student.uts.edu.au"], city: "Sydney", state: "NSW", lat: -33.8830, lng: 151.199 },
  { id: "mq", name: "Macquarie University", emailDomains: ["mq.edu.au", "students.mq.edu.au"], city: "Sydney", state: "NSW", lat: -33.7738, lng: 151.1126 },
  { id: "unimelb", name: "University of Melbourne", emailDomains: ["unimelb.edu.au", "student.unimelb.edu.au"], city: "Melbourne", state: "VIC", lat: -37.7963, lng: 144.9614 },
  { id: "monash", name: "Monash University", emailDomains: ["monash.edu", "student.monash.edu"], city: "Melbourne", state: "VIC", lat: -37.9105, lng: 145.1362 },
  { id: "rmit", name: "RMIT University", emailDomains: ["rmit.edu.au", "student.rmit.edu.au"], city: "Melbourne", state: "VIC", lat: -37.8076, lng: 144.9635 },
  { id: "uq", name: "University of Queensland", emailDomains: ["uq.edu.au", "uqconnect.edu.au", "student.uq.edu.au"], city: "Brisbane", state: "QLD", lat: -27.4975, lng: 153.0137 },
  { id: "qut", name: "Queensland University of Technology", emailDomains: ["qut.edu.au", "connect.qut.edu.au"], city: "Brisbane", state: "QLD", lat: -27.4776, lng: 153.0281 },
  { id: "anu", name: "Australian National University", emailDomains: ["anu.edu.au"], city: "Canberra", state: "ACT", lat: -35.2777, lng: 149.1185 },
  { id: "adelaide", name: "University of Adelaide", emailDomains: ["adelaide.edu.au", "student.adelaide.edu.au"], city: "Adelaide", state: "SA", lat: -34.9205, lng: 138.6047 },
  { id: "uwa", name: "University of Western Australia", emailDomains: ["uwa.edu.au", "student.uwa.edu.au"], city: "Perth", state: "WA", lat: -31.9803, lng: 115.8175 },
];
