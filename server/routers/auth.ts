import { Router } from "express";
import * as c from "../controllers/authController.ts";

export const authRouter = Router();

authRouter.post("/register", c.register);
authRouter.post("/login", c.login);
authRouter.post("/password", c.changePassword);
