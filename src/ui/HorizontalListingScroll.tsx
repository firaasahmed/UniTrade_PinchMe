import { useNavigate } from "react-router-dom";
import type { Listing } from "@/types/Listing";
import { ListingCard } from "@/ui/ListingCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

export function HorizontalListingScroll({
  title,
  listings,
}: {
  title: string;
  listings: Listing[];
  viewAllTo?: string;
}) {
  const navigate = useNavigate();
  if (listings.length === 0) return null;

  return (
    <section className="mb-10">
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <div className="mb-4 flex items-center justify-between gap-3 px-1">
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">{title}</h2>
          <div className="flex items-center gap-2">
            <CarouselPrevious className="static size-9 translate-x-0 translate-y-0 rounded-full border bg-card shadow-sm hover:bg-muted" />
            <CarouselNext className="static size-9 translate-x-0 translate-y-0 rounded-full border bg-card shadow-sm hover:bg-muted" />
          </div>
        </div>

        <CarouselContent className="-ml-4 py-3 px-1">
          {listings.map((l) => (
            <CarouselItem
              key={l.id}
              className="basis-[72%] pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <ListingCard listing={l} onOpen={(id) => navigate(`/listing/${id}`)} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
