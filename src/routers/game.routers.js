import { Router } from "express";
import {
    getGameSession,
    createGameSession
} from "../controllers/game.controller.js";

const router = Router();

router.route("/session/:sessionId").get(getGameSession);
router.route("/session").post(createGameSession);

export default router;
