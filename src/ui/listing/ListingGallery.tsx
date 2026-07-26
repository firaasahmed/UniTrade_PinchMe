import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

function GalleryImage({
  src,
  alt,
  icon: Icon,
}: {
  src: string;
  alt: string;
  icon: LucideIcon;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
        <Icon className="size-16" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="size-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function ListingGallery({
  images,
  alt,
  icon,
}: {
  images: string[];
  alt: string;
  icon: LucideIcon;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const shots = images.length > 0 ? images : [""];

  return (
    <div>
      <Carousel setApi={setApi} opts={{ loop: shots.length > 1 }}>
        <CarouselContent>
          {shots.map((src, i) => (
            <CarouselItem key={`${src}-${i}`}>
              <div className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-foreground/10">
                <GalleryImage src={src} alt={`${alt}, photo ${i + 1}`} icon={icon} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {shots.length > 1 && (
          <>
            <CarouselPrevious className="left-3" />
            <CarouselNext className="right-3" />
          </>
        )}
      </Carousel>

      {shots.length > 1 && (
        <div className="mt-3 flex gap-2">
          {shots.map((src, i) => (
            <button
              key={`thumb-${src}-${i}`}
              onClick={() => api?.scrollTo(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                "aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition-all",
                selected === i ? "ring-primary" : "ring-transparent opacity-70 hover:opacity-100",
              )}
            >
              <GalleryImage src={src} alt={`${alt} thumbnail ${i + 1}`} icon={icon} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
