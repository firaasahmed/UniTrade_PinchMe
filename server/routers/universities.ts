import { Router } from "express";
import * as c from "../controllers/universitiesController.ts";

export const universitiesRouter = Router();

universitiesRouter.get("/", c.list);
universitiesRouter.get("/:id", c.getOne);
