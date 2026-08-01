import { Router } from "express";
import { me, update, purchases, sales, confirmPurchase, refundPurchase } from "../controllers/meController.ts";
import { asyncHandler } from "../lib/asyncHandler.ts";

export const meRouter = Router();

meRouter.get("/", me);
meRouter.patch("/", update);
meRouter.get("/purchases", purchases);
meRouter.get("/sales", sales);
meRouter.post("/purchases/:id/confirm", confirmPurchase);
meRouter.post("/purchases/:id/refund", asyncHandler(refundPurchase));
