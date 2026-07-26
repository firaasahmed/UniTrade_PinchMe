import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { Navbar } from "@/ui/Navbar";
import { Footer } from "@/ui/Footer";

const NO_FOOTER = ["/sell/new", "/sell/edit", "/checkout", "/login", "/register"];

export function RootLayout() {
  const location = useLocation();
  const showFooter = !NO_FOOTER.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <TooltipProvider delayDuration={200}>
      <WatchlistProvider>
        <div className="flex min-h-svh flex-col bg-background">
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
          {showFooter && <Footer />}
          <Toaster position="top-center" richColors />
        </div>
      </WatchlistProvider>
    </TooltipProvider>
  );
}
