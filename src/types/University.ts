export type University = {
  id: string;
  name: string;
  // a uni may verify several domains, e.g. uon.edu.au + newcastle.edu.au
  emailDomains: string[];
  city: string;
  state: string;
  lat: number;
  lng: number;
};
