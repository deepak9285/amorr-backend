import { Router } from "express";

import {
    getAllMessagesofChat,
    getUserConvfromGroup,
    sendMessage,
    sendMessagetoReply,
    deleteMessage,
    getSingleMessage
} from "../controllers/message.controllers.js";

const router = Router();


router.route("/:chatId").post(sendMessage);
router.route("/singleMessage/:messageId").post(getSingleMessage);
router.route("/:chatId/:replyTo").post(sendMessagetoReply);
router.route("/:chatId/:messageId").delete(deleteMessage);
router.route("/chatmessage/chats/:chatId").post(getAllMessagesofChat);
router.route("/userconvo/:chatId").get(getUserConvfromGroup);


export default router;