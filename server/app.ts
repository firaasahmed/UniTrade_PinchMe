import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { config } from "./config.ts";
import { requestLogger } from "./middleware/requestLogger.ts";
import { attachUser } from "./middleware/auth.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { rateLimit } from "./middleware/rateLimit.ts";
import { hasCredentials } from "./payments/index.ts";
import { listingsRouter } from "./routers/listings.ts";
import { universitiesRouter } from "./routers/universities.ts";
import { checkoutRouter } from "./routers/checkout.ts";
import { meRouter } from "./routers/me.ts";
import { authRouter } from "./routers/auth.ts";
import { watchlistRouter } from "./routers/watchlist.ts";
import { messagesRouter } from "./routers/messages.ts";
import { notificationsRouter } from "./routers/notifications.ts";
import { usersRouter } from "./routers/users.ts";
import { dealsRouter } from "./routers/deals.ts";
import { brandDealsRouter } from "./routers/brandDeals.ts";
import { addressesRouter } from "./routers/addresses.ts";
import { merchantsRouter } from "./routers/merchants.ts";
import { useGeocodeProvider } from "./geo.ts";
import { nswAddressProvider } from "./geo/nswAddressProvider.ts";

export function buildApp() {
  // the local extract is the only geocoder — nothing here calls a metered api
  useGeocodeProvider(nswAddressProvider);

  const app = express();
  // behind render/fly/railway proxies, so req.ip is the client and not the load balancer
  app.set("trust proxy", 1);

  // deployed, the api and the app share an origin, so cors is only for split local dev
  app.use(config.corsOrigins.length > 0 ? cors({ origin: config.corsOrigins }) : cors());
  // photos arrive as scaled-down data urls in the listing body, so 100kb won't do
  app.use(express.json({ limit: "12mb" }));
  app.use(requestLogger);
  app.use(attachUser);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, payments: hasCredentials() });
  });

  // guessing a password shouldn't be free
  app.use(
    "/api/auth",
    rateLimit({ windowMs: 15 * 60_000, max: 20, message: "too many attempts — wait a few minutes" }),
    authRouter,
  );
  app.use("/api/me", meRouter);
  app.use("/api/universities", universitiesRouter);
  app.use("/api/listings", listingsRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/watchlist", watchlistRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/deals", dealsRouter);
  app.use("/api/brand-deals", brandDealsRouter);
  app.use("/api/addresses", addressesRouter);
  app.use("/api/merchants", merchantsRouter);

  serveBuiltApp(app);

  // last — turns thrown AppErrors into responses
  app.use(errorHandler);
  return app;
}

// in production the same server hands out the built spa, so there is one origin and no proxy
function serveBuiltApp(app: express.Express): void {
  const dist = resolve("dist");
  if (!existsSync(join(dist, "index.html"))) return;
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(join(dist, "index.html"));
  });
}
