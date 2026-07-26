import { Router } from "express";
import * as c from "../controllers/dealsController.ts";

export const dealsRouter = Router();

dealsRouter.get("/", c.list);
dealsRouter.post("/", c.create);
dealsRouter.post("/:id/accept", c.accept);
dealsRouter.post("/:id/decline", c.decline);
dealsRouter.post("/:id/withdraw", c.withdraw);
dealsRouter.post("/:id/counter", c.counter);
dealsRouter.post("/:id/revise", c.revise);
