import { Router } from "express";
import { swipe } from "../controllers/swipe.controllers.js";

const router = Router();

router.route("/like_dislike").post(swipe);

export default router;
