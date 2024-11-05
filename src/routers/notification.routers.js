import express from "express";
import {
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/notifications", createNotification);
router.get("/notifications/:userId", getUserNotifications);
router.patch("/notifications/:notificationId/read", markNotificationAsRead);

export default router;
