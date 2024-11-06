import { Router } from "express";
import { swipe, updateMatchStatus, getMatchesByStatus } from "../controllers/swipe.controllers.js";

const router = Router();

router.route("/like_dislike").post(swipe);
router.route("/update_match_status").patch(updateMatchStatus);
router.route("/get_matches_by_status").post(getMatchesByStatus);

export default router;