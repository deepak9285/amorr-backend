import { Notification } from "../models/notification.model.js";
import { ApiError } from "./apiError.js";
import { ChatEventEnum } from "../socket/chatEvents.js";
import { emitSocketEvent } from "../socket/socket.js";

const sendNotification = async (req, recipientId, type, messageDetails) => {
    try {
        const notificationData = {
            type,
            recipient: recipientId,
            sender: messageDetails.senderId,
            chat: messageDetails.chatId,
            message: messageDetails._id,
        };

        const notification = await Notification.create(notificationData);

        emitSocketEvent(req, recipientId.toString(), type, notification);

        console.log(`Notification sent to user ${recipientId} for event ${type}`);
    } catch (error) {
        console.error("Error sending notification:", error);
        throw new ApiError(500, "Notification service error");
    }
};

const MessageEventTypes = {
    MESSAGE_SENT: ChatEventEnum.MESSAGE_RECEIVED_EVENT,
    MESSAGE_REPLIED: ChatEventEnum.MESSAGE_REPLY_EVENT,
};

export {
    sendNotification,
    MessageEventTypes
}