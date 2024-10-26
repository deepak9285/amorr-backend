import { Router } from "express";
import { swipe } from "../controllers/swipe.controllers.js";

const router = Router();

router.route("/swipe").post(swipe);

export default router;
