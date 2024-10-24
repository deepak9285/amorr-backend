import { Router } from "express";

import {
    getAllMessages,
    sendMessage,
    deleteMessage
} from "../controllers/message.controllers.js";

const router = Router();

router.route("/:chatId").post(sendMessage);
router.route("/allmessage/:chatId").get(getAllMessages);
router.route("/:chatId/:messageId").delete(deleteMessage);

export default router;