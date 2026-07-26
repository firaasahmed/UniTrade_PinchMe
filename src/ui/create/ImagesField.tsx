import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fileToDataUrl, isImageFile, isUsableImageSrc, MAX_PHOTOS } from "@/utils/image";
import { Plus, X, ImagePlus, Upload, Loader2, Star, Link2 } from "lucide-react";

// photos come off a phone, so the file picker is the main path — a url is the fallback
export function ImagesField({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);
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
    if (added.length) {
      onChange([...images, ...added]);
      toast.success(added.length === 1 ? "Photo added" : `${added.length} photos added`);
    }
  }

  function addUrl() {
    const v = url.trim();
    if (v === "") return;
    if (!isUsableImageSrc(v)) {
      toast.error("That doesn't look like an image link");
      return;
    }
    if (images.includes(v)) {
      toast.error("That photo is already here");
      return;
    }
    if (full) {
      toast.error(`Only ${MAX_PHOTOS} photos per listing`);
      return;
    }
    onChange([...images, v]);
    setUrl("");
  }

  const makeCover = (i: number) => onChange([images[i] as string, ...images.filter((_, j) => j !== i)]);
  const remove = (i: number) => onChange(images.filter((_, j) => j !== i));

  return (
    <div className="space-y-3">
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

      <div
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
          "flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
          dragging && "border-primary bg-accent",
          full && "opacity-60",
        )}
      >
        {busy ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          {full ? `That's all ${MAX_PHOTOS} photos` : "Drag photos here, or"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || full}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
            Choose photos
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={full}
            onClick={() => setShowUrl((s) => !s)}
          >
            <Link2 className="size-4" />
            Use a link
          </Button>
        </div>
        {images.length === 0 && !busy && (
          <p className="text-xs text-muted-foreground">
            No photos yet — a category placeholder will be shown instead
          </p>
        )}
      </div>

      {showUrl && !full && (
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="Paste an image URL"
          />
          <Button type="button" variant="outline" onClick={addUrl}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      )}

      {images.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((src, i) => (
              <div key={`${src.slice(0, 40)}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border">
                <img src={src} alt={`photo ${i + 1}`} className="size-full object-cover" />
                {i === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="absolute left-1 top-1 rounded bg-background/90 p-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Make cover photo"
                    title="Make cover"
                  >
                    <Star className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {images.length} of {MAX_PHOTOS} · the cover photo is what buyers see first
          </p>
        </>
      )}
    </div>
  );
}
