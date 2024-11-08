import { Router } from "express";
import { fetch_by_preferences, like_profile, updateProfile, calculateProfileCompleteness, fetch_by_id } from "../controllers/profile.controller.js";
import { uploadFile } from "../utils/aws.js";

const router = Router();

router.route("/update").post(updateProfile);
router.route("/fetch/preference").post(fetch_by_preferences);
router.route("/like").post(like_profile);
router.route("/profile/completeness").post(calculateProfileCompleteness);
router.route("/fetch/id").post(fetch_by_id);

router.route("/test-upload").post(async () => {
    await uploadFile()
})

export default router;