import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Laptop,
  Sofa,
  BookOpen,
  CookingPot,
  Bike,
  Shirt,
  Package,
  MonitorSmartphone,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

type CategoryOption = {
  id: string;
  name: string;
  category: string;
  icon: LucideIcon;
  isCenter?: boolean;
};

// 3x3 grid layout with Laptops right in the center (position 5 of 9)
const CATEGORIES: CategoryOption[] = [
  { id: "textbooks", name: "Textbooks", category: "Textbooks", icon: BookOpen },
  { id: "furniture", name: "Furniture", category: "Furniture", icon: Sofa },
  { id: "electronics", name: "Electronics", category: "Electronics", icon: MonitorSmartphone },
  { id: "kitchen", name: "Kitchen", category: "Kitchen", icon: CookingPot },
  { id: "laptops", name: "Laptops", category: "Laptops", icon: Laptop, isCenter: true },
  { id: "transport", name: "Transport", category: "Transport", icon: Bike },
  { id: "clothing", name: "Clothing", category: "Clothing", icon: Shirt },
  { id: "other", name: "Other", category: "Other", icon: Package },
  { id: "all", name: "All Items", category: "", icon: LayoutGrid },
];

export function ItemCategoriesModal({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function selectCategory(cat: string) {
    setOpen(false);
    if (cat) {
      navigate(`/items?category=${encodeURIComponent(cat)}`);
    } else {
      navigate("/items");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <button className="font-medium text-primary hover:underline">Browse Items</button>}
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="font-heading text-xl font-bold">Browse Item Categories</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose a category to browse listings on campus
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.category)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center text-foreground transition-all cursor-pointer hover:border-primary/50 hover:bg-accent/50"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </div>
                <span className="text-xs font-semibold">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
