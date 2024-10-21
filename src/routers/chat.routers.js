import { Router } from "express";

import {
    createOrGetAOneOnOneChat,
    getAllChats
} from "../controllers/chat.controllers.js";

const router = Router();

router.route("/oneOnone/:receiverId").post(createOrGetAOneOnOneChat);
router.route("/allchats").post(getAllChats);

export default router;

