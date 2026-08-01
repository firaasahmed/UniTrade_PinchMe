import { NavLink, Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Package, ShoppingBag, Plus, Wallet } from "lucide-react";

const LINKS = [
  { to: "/sell", label: "My listings", icon: Package, end: true },
  { to: "/sell/sales", label: "Sales", icon: Wallet, end: false },
  { to: "/sell/purchases", label: "My purchases", icon: ShoppingBag, end: false },
];

export function SellLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Top Header Row with Centered 2-Tab Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        {/* Left spacer to align centered tabs */}
        <div className="hidden md:block md:w-32" />

        {/* Centered 2-Tab Navigation Switcher */}
        <div className="flex rounded-xl border border-border/80 bg-muted p-1 shadow-xs">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-5 py-2.5 text-base font-semibold transition-all",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <l.icon className="size-4.5" />
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right Action Button */}
        <Button asChild size="default" className="font-semibold">
          <Link to="/sell/new">
            <Plus className="size-4" />
            New listing
          </Link>
        </Button>
      </div>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
