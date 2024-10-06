import { Router } from "express";
import { updateProfile } from "../controllers/profile.controller";

const router = Router();

router.route("/update").post(updateProfile);

export default router;