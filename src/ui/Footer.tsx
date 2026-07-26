import { Link } from "react-router-dom";
import { UniTradeLogo } from "@/ui/brand/UniTradeLogo";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <UniTradeLogo />
            <p className="mt-3 text-sm text-muted-foreground">
              The verified student marketplace. Buy, sell, rent and hire safely across
              Australian universities.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-verified">
              <ShieldCheck className="size-3.5" />
              Student-only. Pay through the platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <FooterCol title="Marketplace">
              <FooterLink to="/buy">Browse all</FooterLink>
              <FooterLink to="/items">Items</FooterLink>
              <FooterLink to="/services">Services</FooterLink>
              <FooterLink to="/accommodation">Accommodation</FooterLink>
              <FooterLink to="/deals">Student deals</FooterLink>
              <FooterLink to="/sell/new">Start selling</FooterLink>
            </FooterCol>
            <FooterCol title="Account">
              <FooterLink to="/sell">My listings</FooterLink>
              <FooterLink to="/watchlist">Watchlist</FooterLink>
              <FooterLink to="/account">Settings</FooterLink>
            </FooterCol>
            <FooterCol title="Trust">
              <span className="text-muted-foreground">University-verified</span>
              <span className="text-muted-foreground">Secure payments</span>
              <span className="text-muted-foreground">Buyer protection</span>
            </FooterCol>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          © 2026 UniTrade. Built for students, by students.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-heading text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-muted-foreground transition-colors hover:text-foreground">
      {children}
    </Link>
  );
}
