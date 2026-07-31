import { Router } from "express";
import * as c from "../controllers/merchantsController.ts";
import { asyncHandler } from "../lib/asyncHandler.ts";

export const merchantsRouter = Router();

merchantsRouter.get("/me", asyncHandler(c.mine));
merchantsRouter.post("/", asyncHandler(c.create));
