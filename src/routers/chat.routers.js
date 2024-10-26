import { Router } from "express";

import {
    createAGroupChat,
    createOrGetAOneOnOneChat,
    getAllChats,
    getUserStatus,
    blockUser,
    unblockUser,
    checkBlockStatus
} from "../controllers/chat.controllers.js";

const router = Router();

router.route("/oneOnone/:receiverId").post(createOrGetAOneOnOneChat);
router.route("/group").post(createAGroupChat);
router.route("/allchats").post(getAllChats);
router.route("/status/:userId").get(getUserStatus);

router.route("/block/:userToBlockId").post(blockUser);
router.route("/unblock/:userToUnblockId").post(unblockUser);
router.route("/checkblock/:userToCheckId").get(checkBlockStatus);
export default router;

