import { Router } from "express";
import * as c from "../controllers/addressesController.ts";
import { asyncHandler } from "../lib/asyncHandler.ts";

export const addressesRouter = Router();

addressesRouter.get("/suggest", asyncHandler(c.suggest));
// before /:id or the path is swallowed by it
addressesRouter.get("/manual", c.manual);
addressesRouter.get("/:id", asyncHandler(c.resolve));
