import { Router } from "express";

import {
  forgetPassword,
  loginUser,
  register,
  sendEmailOtp,
  sendForgetPasswordMail,
  verifyEmailOtp
} from "../controllers/auth.controllers.js";

const router = Router();

router.route("/login").post(loginUser);
router.route("/register").post(register);
router.route("/forget-password").post(forgetPassword);
router.route("/send-forget-password-mail").post(sendForgetPasswordMail);
router.route("/send-email-otp").post(sendEmailOtp);
router.route("/verify-email-otp").post(verifyEmailOtp);

export default router;
