import type { Listing } from "@/types/Listing";
import { campusDistance, type CampusDistance } from "@/utils/distance";
import { useSession } from "@/session/SessionContext";

// measure against whichever campus is actually near the place — your own if you're
// studying nearby, otherwise the host's. stops a sydney student seeing "760 km from campus"
// on a melbourne room
export function useCampusDistance(listing: Listing): CampusDistance | null {
  const { state } = useSession();
  const viewerUni = state.status === "signedIn" ? state.user.universityId : "";

  const mine = viewerUni ? campusDistance(listing, viewerUni) : null;
  const theirs = campusDistance(listing, listing.seller.universityId);

  if (!mine) return theirs;
  if (!theirs) return mine;
  return mine.km <= theirs.km ? mine : theirs;
}
