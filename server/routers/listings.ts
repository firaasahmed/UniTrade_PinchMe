import { Router } from "express";
import * as c from "../controllers/listingsController.ts";
import { validateBody } from "../middleware/validate.ts";
import { parseNewListing, parseListingPatch } from "../validation/listing.ts";

export const listingsRouter = Router();

listingsRouter.get("/", c.list);
// static routes before :id so they aren't captured as an id
listingsRouter.get("/mine", c.mine);
listingsRouter.post("/", validateBody(parseNewListing), c.create);
listingsRouter.get("/:id", c.getOne);
listingsRouter.patch("/:id", validateBody(parseListingPatch), c.update);
listingsRouter.post("/:id/sold", c.markSold);
listingsRouter.delete("/:id", c.remove);
