import { Router } from "express";
import { fetch_by_preferences, like_profile, updateProfile, calculateProfileCompleteness, fetchProfileByUserID } from "../controllers/profile.controller.js";

const router = Router();

router.route("/update").post(updateProfile);
router.route("/fetch/preference").post(fetch_by_preferences);
router.route("/like").post(like_profile);
router.route("/profile/completeness").post(calculateProfileCompleteness);
router.route("/fetchById").post(fetchProfileByUserID);

export default router;