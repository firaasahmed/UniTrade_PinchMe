import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import type { SessionUser } from "@/types/User";
import { useSession } from "@/session/SessionContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { UniTradeLogo } from "@/ui/brand/UniTradeLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/utils/format";
import {
  Search,
  Plus,
  Menu,
  ShieldCheck,
  Package,
  Heart,
  LogOut,
  User,
  MessageSquare,
  Bell,
  Wrench,
  Home,
  Sparkles,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";

// ghost buttons sitting on the navy bar
const NAV_GHOST =
  "text-primary-foreground hover:bg-primary-foreground/12 hover:text-primary-foreground";

function SearchBox({
  onSubmit,
  autoFocus,
  onDark = false,
}: {
  onSubmit?: () => void;
  autoFocus?: boolean;
  onDark?: boolean;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    navigate(q.trim() ? `/buy?q=${encodeURIComponent(q.trim())}` : "/buy");
    onSubmit?.();
  }
  return (
    <form onSubmit={submit} className="relative w-full">
      <Search
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2",
          onDark ? "text-nav-from/55" : "text-muted-foreground",
        )}
      />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Search desks, textbooks, rooms…"
        className={cn(
          "h-10 pl-9",
          onDark &&
            "border-transparent bg-primary-foreground text-foreground shadow-md shadow-black/15 placeholder:text-muted-foreground focus-visible:border-gold focus-visible:ring-gold/40",
        )}
        aria-label="Search listings"
      />
    </form>
  );
}

export function Navbar() {
  const { state, signOut } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const signedIn = state.status === "signedIn";

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-[rgb(32,22,109)] to-[rgb(1,7,95)] text-primary-foreground shadow-md">
      {/* unit-main layout: brand left, nav centred, actions right */}
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 pb-3 pt-4 lg:grid-cols-[1fr_auto_1fr]">
        <Link
          to="/"
          className="justify-self-start rounded-md outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <UniTradeLogo onDark />
        </Link>

        {/* browse collapses the three kinds; add listing sits here, away from the profile cluster */}
        <nav className="hidden justify-self-center lg:flex lg:items-center lg:gap-1">
          <BrowseMenu active={BROWSE_LINKS.some((l) => l.to === location.pathname)} />
          <NavItem to="/deals" label="Student deals" icon={Sparkles} active={location.pathname === "/deals"} />
          <Button
            asChild
            size="sm"
            className="ml-2 bg-gold font-semibold text-gold-foreground hover:bg-gold/90"
          >
            <Link to="/sell/new">
              <Plus className="size-4" />
              Add listing
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <Button
            asChild
            size="sm"
            className="bg-gold font-semibold text-gold-foreground hover:bg-gold/90 sm:inline-flex lg:hidden"
          >
            <Link to="/sell/new">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add listing</span>
            </Link>
          </Button>

          {signedIn ? (
            <>
              {/* one row, one gap, so the icons read as a set */}
              <div className="hidden items-center gap-0.5 sm:flex">
                <IndicatorNav />
                <WatchlistNav />
              </div>
              <UserMenu user={state.user} onSignOut={() => { signOut(); navigate("/"); }} />
            </>
          ) : (
            <div className="hidden items-center sm:flex">
              <Button asChild size="sm" variant="secondary">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          )}

          <MobileMenu
            signedIn={signedIn}
            user={signedIn ? state.user : null}
            onSignOut={() => { signOut(); navigate("/"); }}
            currentPath={location.pathname}
          />
        </div>
      </div>

      <div className="mx-auto hidden max-w-3xl px-4 pb-4 md:block">
        <SearchBox onDark />
      </div>
    </header>
  );
}

const BROWSE_LINKS = [
  { to: "/items", label: "Items", icon: Package, blurb: "Furniture, tech, textbooks" },
  { to: "/services", label: "Services", icon: Wrench, blurb: "Tutoring, moving, repairs" },
  { to: "/accommodation", label: "Accommodation", icon: Home, blurb: "Rooms and share houses" },
];

function BrowseMenu({ active }: { active: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-[#30248a] hover:text-white",
            active && "bg-white/12 text-white",
          )}
        >
          <LayoutGrid className="size-4" />
          Browse
          <ChevronDown className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {BROWSE_LINKS.map((l) => (
          <DropdownMenuItem key={l.to} asChild>
            <Link to={l.to} className="flex items-start gap-2.5 py-2">
              <l.icon className="mt-0.5 size-4 shrink-0" />
              <span className="flex flex-col">
                <span className="font-medium">{l.label}</span>
                <span className="text-xs text-muted-foreground">{l.blurb}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/buy">Browse all</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Package;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-[#30248a] hover:text-white",
        active && "bg-white/12 text-white",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function IndicatorNav() {
  const { messages, notifications } = useUnreadCounts();
  return (
    <div className="hidden items-center sm:flex">
      <IconLink to="/messages" label="Messages" count={messages}>
        <MessageSquare className="size-5" />
      </IconLink>
      <IconLink to="/notifications" label="Notifications" count={notifications}>
        <Bell className="size-5" />
      </IconLink>
    </div>
  );
}

function IconLink({
  to,
  label,
  count,
  children,
}: {
  to: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Button asChild variant="ghost" size="icon" className={cn("relative", NAV_GHOST)} aria-label={label}>
      <Link to={to}>
        {children}
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-gold-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}

function WatchlistNav() {
  const { count } = useWatchlist();
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn("relative hidden sm:inline-flex", NAV_GHOST)}
      aria-label="Watchlist"
    >
      <Link to="/watchlist">
        <Heart className="size-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-gold-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}

function UserMenu({ user, onSignOut }: { user: SessionUser; onSignOut: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold">
          <Avatar className="size-9 ring-2 ring-primary-foreground/25">
            <AvatarFallback className="bg-primary-foreground/15 text-xs font-semibold text-primary-foreground">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          {user.verified && (
            <ShieldCheck className="absolute -right-0.5 -bottom-0.5 size-4 rounded-full bg-primary text-gold" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{user.university}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/sell"><Package className="size-4" />My listings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/watchlist"><Heart className="size-4" />Watchlist</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account"><User className="size-4" />Account</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}>
          <LogOut className="size-4" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu({
  signedIn,
  user,
  onSignOut,
  currentPath,
}: {
  signedIn: boolean;
  user: SessionUser | null;
  onSignOut: () => void;
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("md:hidden", NAV_GHOST)} aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 gap-0 p-0">
        <div className="border-b p-4">
          <UniTradeLogo />
          {signedIn && user && (
            <p className="mt-3 text-sm">
              <span className="font-medium">{user.name}</span>
              <span className="block text-xs text-muted-foreground">{user.university}</span>
            </p>
          )}
        </div>
        <div className="p-4">
          <SearchBox onSubmit={() => setOpen(false)} />
        </div>
        <nav className="flex flex-col px-2">
          <MobileLink to="/items" label="Items" active={currentPath === "/items"} onNavigate={() => setOpen(false)} />
          <MobileLink to="/services" label="Services" active={currentPath === "/services"} onNavigate={() => setOpen(false)} />
          <MobileLink to="/accommodation" label="Accommodation" active={currentPath === "/accommodation"} onNavigate={() => setOpen(false)} />
          <MobileLink to="/buy" label="Browse everything" active={currentPath === "/buy"} onNavigate={() => setOpen(false)} />
          <MobileLink to="/deals" label="Student deals" active={currentPath === "/deals"} onNavigate={() => setOpen(false)} />
          <MobileLink to="/sell/new" label="Add Listing" active={currentPath === "/sell/new"} onNavigate={() => setOpen(false)} />
          {signedIn ? (
            <>
              <MobileLink to="/sell" label="My listings" active={currentPath.startsWith("/sell") && currentPath !== "/sell/new"} onNavigate={() => setOpen(false)} />
              <MobileLink to="/messages" label="Messages" active={currentPath === "/messages"} onNavigate={() => setOpen(false)} />
              <MobileLink to="/notifications" label="Notifications" active={currentPath === "/notifications"} onNavigate={() => setOpen(false)} />
              <MobileLink to="/watchlist" label="Watchlist" active={currentPath === "/watchlist"} onNavigate={() => setOpen(false)} />
              <MobileLink to="/account" label="Account" active={currentPath === "/account"} onNavigate={() => setOpen(false)} />
              <SheetClose asChild>
                <button
                  onClick={onSignOut}
                  className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  Sign out
                </button>
              </SheetClose>
            </>
          ) : (
            <MobileLink to="/login" label="Sign in" active={currentPath === "/login"} onNavigate={() => setOpen(false)} />
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileLink({
  to,
  label,
  active,
  onNavigate,
}: {
  to: string;
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <SheetClose asChild>
      <Link
        to={to}
        onClick={onNavigate}
        className={
          active
            ? "rounded-md bg-accent px-3 py-2.5 text-sm font-medium"
            : "rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
        }
      >
        {label}
      </Link>
    </SheetClose>
  );
}
