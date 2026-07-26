import { useParams, useSearchParams } from "react-router-dom";
import { CreateListing } from "@/ui/create/CreateListing";
import { RequireAuth } from "@/ui/RequireAuth";
import { isListingKind } from "@/utils/categories";

export function CreateListingPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const kind = params.get("kind");
  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <CreateListing editId={id} presetKind={isListingKind(kind) ? kind : undefined} />
      </div>
    </RequireAuth>
  );
}
