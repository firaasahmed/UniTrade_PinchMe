import { Router } from "express";
import * as c from "../controllers/notificationsController.ts";

export const notificationsRouter = Router();

notificationsRouter.get("/", c.list);
notificationsRouter.get("/unread", c.unread);
notificationsRouter.post("/read-all", c.markAll);
notificationsRouter.post("/:id/read", c.markRead);
