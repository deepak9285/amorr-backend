import { Router } from "express";

import {
  loginUser,
  register,
  sendEmailOtp,
  verifyEmailOtp
} from "../controllers/auth.controllers.js";

const router = Router();

router.route("/login").post(loginUser);
router.route("/register").post(register);
router.route("/send-email-otp").post(sendEmailOtp);
router.route("/verify-email-otp").post(verifyEmailOtp);

export default router;

