import { Router } from "express";
import * as c from "../controllers/messagesController.ts";

export const messagesRouter = Router();

messagesRouter.get("/", c.list);
messagesRouter.get("/unread", c.unread);
messagesRouter.get("/thread", c.thread);
messagesRouter.post("/", c.send);
