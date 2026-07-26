import { Router } from "express";
import * as c from "../controllers/watchlistController.ts";

export const watchlistRouter = Router();

watchlistRouter.get("/", c.get);
watchlistRouter.post("/:id", c.add);
watchlistRouter.delete("/:id", c.remove);
