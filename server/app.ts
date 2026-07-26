import express from "express";
import cors from "cors";
import { requestLogger } from "./middleware/requestLogger.ts";
import { attachUser } from "./middleware/auth.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { hasCredentials } from "./pinch.ts";
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

export function buildApp() {
  const app = express();

  app.use(cors());
  // photos arrive as scaled-down data urls in the listing body, so 100kb won't do
  app.use(express.json({ limit: "12mb" }));
  app.use(requestLogger);
  app.use(attachUser);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, payments: hasCredentials() });
  });
  app.use("/api/auth", authRouter);
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

  // last — turns thrown AppErrors into responses
  app.use(errorHandler);
  return app;
}
