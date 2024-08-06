import { Router } from "express";
import { loginUser, register } from "../controllers/auth.controllers";

const router = Router();

router.route("/login").post(loginUser);
router.route("/register").post(register);

export default router;

