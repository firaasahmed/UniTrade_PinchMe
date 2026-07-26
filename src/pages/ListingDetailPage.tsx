import { useParams } from "react-router-dom";
import { ListingDetail } from "@/ui/ListingDetail";

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <ListingDetail id={id} />
    </div>
  );
}
