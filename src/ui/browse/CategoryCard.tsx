import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// the square tile used for both item categories and accommodation providers
export function CategoryCard({
  label,
  sub,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  sub?: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md",
        active && "border-primary bg-primary/5 font-semibold text-primary ring-1 ring-primary/30",
      )}
    >
      <Icon className="size-6 shrink-0" />
      {/* smaller on narrow phones so long words like "accommodation" still fit whole */}
      <span className="w-full text-xs leading-tight break-words sm:text-sm">{label}</span>
      {sub && (
        <span className="w-full text-xs font-normal break-words text-muted-foreground">{sub}</span>
      )}
    </button>
  );
}
