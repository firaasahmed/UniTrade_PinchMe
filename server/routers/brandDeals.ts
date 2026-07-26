import { Router } from "express";
import * as c from "../controllers/brandDealsController.ts";

export const brandDealsRouter = Router();

brandDealsRouter.get("/", c.list);
