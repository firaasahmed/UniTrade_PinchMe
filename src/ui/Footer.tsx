import { Link } from "react-router-dom";
import { UniTradeLogo } from "@/ui/brand/UniTradeLogo";
import { PinchLogo } from "@/ui/brand/PinchLogo";
import { GraduationCap, Lock, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-gradient-to-b from-nav-from to-nav-to text-primary-foreground">
      <div className="pointer-events-none absolute -left-24 top-0 size-72 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 size-64 rounded-full bg-verified/15 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-16">
          <div className="max-w-sm">
            <UniTradeLogo onDark />
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
              The verified student marketplace. Buy, sell, rent and hire across
              Australian universities with deals in chat and payments through Pinch.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <TrustChip icon={ShieldCheck} label="Uni verified" />
              <TrustChip icon={Lock} label="Secure payments" />
              <TrustChip icon={GraduationCap} label="Students only" />
            </div>

            <p className="mt-6 flex items-center gap-1.5 text-xs text-primary-foreground/55">
              <span>Payments by</span>
              <span className="rounded-sm bg-white px-1 py-0.5 leading-none">
                <PinchLogo height={12} />
              </span>
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10 lg:max-w-xl">
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
              <span className="text-primary-foreground/55">University-verified</span>
              <span className="text-primary-foreground/55">Buyer protection</span>
              <span className="text-primary-foreground/55">Deal history in chat</span>
            </FooterCol>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 UniTrade. Built for students, by students.</p>
          <p className="sm:text-right">
            Campus trade with a payment trail.
          </p>
        </div>
      </div>
    </footer>
  );
}

function TrustChip({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-2.5 py-1 text-[11px] font-medium text-primary-foreground/80">
      <Icon className="size-3 text-gold" />
      {label}
    </span>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="font-heading text-sm font-semibold text-gold">{title}</p>
      {children}
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-sm text-primary-foreground/60 transition-colors hover:text-gold"
    >
      {children}
    </Link>
  );
}
