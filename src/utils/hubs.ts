// student hubs group nearby suburbs so a profile reads "Central Coast Hub" not "Ourimbah, NSW"
const HUBS: { hub: string; suburbs: string[] }[] = [
  { hub: "Central Coast Hub", suburbs: ["ourimbah", "gosford", "terrigal", "wyong", "erina"] },
  { hub: "Newcastle Hub", suburbs: ["callaghan", "newcastle"] },
  { hub: "Sydney Hub", suburbs: ["kensington", "camperdown", "ultimo", "glebe", "sydney"] },
  { hub: "Melbourne Hub", suburbs: ["parkville", "clayton", "carlton", "melbourne"] },
  { hub: "Brisbane Hub", suburbs: ["st lucia", "west end", "brisbane"] },
  { hub: "Canberra Hub", suburbs: ["acton", "canberra"] },
  { hub: "Adelaide Hub", suburbs: ["adelaide"] },
];

// falls back to the raw location when a suburb isn't mapped to a hub yet
export function hubFor(location: string): string {
  const l = location.toLowerCase();
  return HUBS.find((h) => h.suburbs.some((s) => l.includes(s)))?.hub ?? location;
}
