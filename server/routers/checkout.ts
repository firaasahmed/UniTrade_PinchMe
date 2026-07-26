import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.ts";
import * as c from "../controllers/checkoutController.ts";

export const checkoutRouter = Router();

checkoutRouter.post("/", asyncHandler(c.create));
checkoutRouter.post("/link", asyncHandler(c.startLink));
checkoutRouter.post("/link/confirm", asyncHandler(c.confirmLink));
