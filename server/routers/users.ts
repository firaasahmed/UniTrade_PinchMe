import { Router } from "express";
import * as c from "../controllers/usersController.ts";

export const usersRouter = Router();

usersRouter.get("/:id", c.getProfile);
