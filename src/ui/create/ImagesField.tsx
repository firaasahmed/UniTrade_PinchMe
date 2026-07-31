import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fileToDataUrl, isImageFile, MAX_PHOTOS } from "@/utils/image";
import { X, ImagePlus, Loader2, Star } from "lucide-react";

// photos come off a phone, so the file picker is the only path
export function ImagesField({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const room = MAX_PHOTOS - images.length;
  const full = room <= 0;

  async function addFiles(files: FileList | File[]) {
    const picked = [...files];
    if (picked.length === 0) return;
    const usable = picked.filter(isImageFile);
    if (usable.length === 0) {
      toast.error("Those files aren't images");
      return;
    }
    if (usable.length < picked.length) toast.error("Skipped files that weren't images");

    const taking = usable.slice(0, Math.max(0, room));
    if (taking.length < usable.length) toast.error(`Only ${MAX_PHOTOS} photos per listing`);
    if (taking.length === 0) return;

    setBusy(true);
    const added: string[] = [];
    for (const file of taking) {
      try {
        const src = await fileToDataUrl(file);
        // the same photo twice adds nothing
        if (!images.includes(src) && !added.includes(src)) added.push(src);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "couldn't add that photo");
      }
    }
    setBusy(false);
    if (added.length) onChange([...images, ...added]);
  }

  const makeCover = (i: number) => onChange([images[i] as string, ...images.filter((_, j) => j !== i)]);
  const remove = (i: number) => onChange(images.filter((_, j) => j !== i));

  return (
    <div className="flex h-full flex-col gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void addFiles(e.target.files);
          // same file twice in a row should still fire onChange
          e.target.value = "";
        }}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {images.map((src, i) => (
            <div
              key={`${src.slice(0, 40)}-${i}`}
              className="group relative aspect-square overflow-hidden rounded-md border"
            >
              <img src={src} alt={`photo ${i + 1}`} className="size-full object-cover" />
              {i === 0 ? (
                <span className="absolute inset-x-0 bottom-0 bg-primary/85 text-center text-[9px] font-medium leading-4 text-primary-foreground">
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  className="absolute bottom-0.5 left-0.5 rounded bg-background/90 p-0.5 text-foreground"
                  aria-label={`Make photo ${i + 1} the cover`}
                  title="Make cover"
                >
                  <Star className="size-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-foreground"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* the tile is the picker — clicking anywhere on it opens the file dialog */}
      <button
        type="button"
        disabled={busy || full}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          // matches the text inputs: same radius, border and background
          "flex min-h-24 flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-input bg-background text-muted-foreground transition-colors",
          !full && "hover:border-ring hover:bg-accent/40",
          dragging && "border-ring bg-accent",
          full && "opacity-60",
        )}
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
        <span className="text-xs">{full ? `Max ${MAX_PHOTOS}` : "Add photos"}</span>
      </button>
    </div>
  );
}
