import { Notification } from "../models/notificationModel.js";

const createNotification = async (req, res) => {
    const { type, recipient, sender, chat, message } = req.body;
    try {
        const notification = new Notification({
            type,
            recipient,
            sender,
            chat,
            message,
        });
        await notification.save();
        return res.status(201).json(notification);
    } catch (error) {
        return res.status(500).json({ message: "Failed to create notification", error });
    }
};

const getUserNotifications = async (req, res) => {
    const { userId } = req.params;
    try {
        const notifications = await Notification.find({ recipient: userId }).populate("sender chat message");
        return res.status(200).json(notifications);
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve notifications", error });
    }
};

const markNotificationAsRead = async (req, res) => {
    const { notificationId } = req.params;
    try {
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );
        return res.status(200).json(notification);
    } catch (error) {
        return res.status(500).json({ message: "Failed to mark notification as read", error });
    }
};

export {
    getUserNotifications,
    createNotification,
    markNotificationAsRead
}