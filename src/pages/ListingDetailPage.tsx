import { useParams } from "react-router-dom";
import { ListingDetail } from "@/ui/ListingDetail";

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  // ListingDetail brings its own container — wrapping it again doubles the padding
  return <ListingDetail id={id} />;
}
