import { Router } from "express";

import {
    getAllMessagesofChat,
    getUserConvfromGroup,
    sendMessage,
    sendMessagetoReply,
    deleteMessage
} from "../controllers/message.controllers.js";

const router = Router();


router.route("/:chatId").post(sendMessage);
router.route("/:chatId/:replyTo").post(sendMessagetoReply);
router.route("/:chatId/:messageId").delete(deleteMessage);

router.route("/chatmessage/chats/:chatId").post(getAllMessagesofChat);
router.route("/userconvo/:chatId").get(getUserConvfromGroup);


export default router;