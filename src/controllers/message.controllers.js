import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ChatMessage } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { ChatEventEnum } from "../socket/chatEvents.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitSocketEvent } from "../socket/socket.js";
import { sendNotification, MessageEventTypes } from "../utils/notification.js";
import generateHash from "../utils/generateHash.js";
import fs from "fs";

const getStaticFilePath = (req, fileName) => {
    return `${req.protocol}://${req.get("host")}/images/${fileName}`;
};

const getLocalPath = (fileName) => {
    return `public/images/${fileName}`;
};

const removeLocalFile = (localPath) => {
    fs.unlink(localPath, (err) => {
        if (err) console.error("Error while removing local files: ", err);
        else {
            console.info("Removed local: ", localPath);
        }
    });
};

const getAllMessagesofChat =asyncHandler (async (req, res) => {
    const { chatId } = req.params;

    const selectedChat = await Chat.findById(chatId);
    if (!selectedChat) {
        return res.status(404).json(new ApiError(404, "Chat does not exist"));
    }

    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json(new ApiError(401, "User ID is required"));
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new ApiError(404, "User not found"));
    }
    req.user = user;

    if (!selectedChat.participants?.includes(req.user._id)) {
        return res.status(400).json(new ApiError(400, "User is not a part of this chat"));
    }

    const messages = await ChatMessage.find({ msg_conversation_hash: chatId, msg_deleted_status: false })
        .sort({ msg_timestamp: -1 })
        .populate("msg_sender_amorr_id", "username")
        .populate("msg_conversation_hash", "name isGroup");

    const textMessages = messages.map(message => ({
        id: message._id,
        text: message.msg_text,
        sender: message.msg_sender_amorr_id.username,
        timestamp: message.msg_timestamp,
        mediaUrl: message.msg_mediaUrl,
    }));

    return res.status(200).json(new ApiResponse(200, textMessages, "Messages fetched successfully"));

});

const getUserConvfromGroup = asyncHandler(async (req, res) => {
    const { chatId } = req.params;

    const selectedChat = await Chat.findById(chatId);
    if (!selectedChat) {
        return res.status(404).json(new ApiError(404, "Chat does not exist"));
    }

    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json(new ApiError(401, "User ID is required"));
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new ApiError(404, "User not found"));
    }
    req.user = user;

    if (!selectedChat.participants?.includes(req.user._id)) {
        return res.status(400).json(new ApiError(400, "User is not a part of this chat"));
    }

    const messages = await ChatMessage.find({ msg_conversation_hash: chatId, msg_deleted_status: false, msg_sender_amorr_id: req.user._id })
        .sort({ msg_timestamp: -1 })
        .populate("msg_sender_amorr_id", "username");

    return res.status(200).json(new ApiResponse(200, messages || [], "Messages fetched successfully"));
});

const sendMessage = asyncHandler(async(req, res) => {
        const { chatId } = req.params;
        const { content } = req.body;
        const userId = req.headers['user-id'];

        if (!userId) {
            return res.status(401).json(new ApiError(401, "User ID is required"));
        }

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json(new ApiError(400, "Invalid User ID format"));
        }


        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        if (!content && !(req.files?.attachments?.length > 0)) {
            return res.status(400).json(new ApiError(400, "Message content or attachment is required"));
        }

        const selectedChat = await Chat.findById(chatId);

        if (!selectedChat) {
            return res.status(404).json(new ApiError(404, "Chat does not exist"));
        }

        const messageFiles = [];
        if (req.files && req.files.attachments?.length > 0) {
            req.files.attachments.map((attachment) => {
                messageFiles.push({
                    url: getStaticFilePath(req, attachment.filename),
                    localPath: getLocalPath(attachment.filename),
                });
            });
        }

        // Generate a unique message hash ID
        const msgId = await generateHash(`${chatId}-${userId}-${Date.now()}`) || new mongoose.Types.ObjectId().toString();

        const message = await ChatMessage.create({
            msg_hash: msgId,
            msg_conversation_hash: chatId,
            msg_sender_amorr_id: userId,
            msg_timestamp: Date.now(),
            msg_added_time: Date.now(),
            msg_updated_time: Date.now(),
            msg_sent_status: true,
            msg_deleted_status: false,
            msg_text: content || "",
            msg_mediaUrl: messageFiles,
        });

        const chat = await Chat.findByIdAndUpdate(
            chatId,
            {
                $set: {
                    lastMessage: message._id,
                },
            },
            { new: true }
        );

        const receivedMessage = await ChatMessage.findById(message._id)
            .populate("msg_sender_amorr_id", "isOnline username")
            .populate("msg_conversation_hash", "name isGroup userBlocked lastMessage");

        if (!receivedMessage) {
            return res.status(500).json(new ApiError(500, "Internal server error"));
        }

        chat.participants.forEach(async(participantObjectId) => {
            if (participantObjectId.toString() === userId.toString()) return;

            emitSocketEvent(
                req,
                participantObjectId.toString(),
                ChatEventEnum.MESSAGE_RECEIVED_EVENT,
                receivedMessage
            );
            await sendNotification(req, participantObjectId.toString(), MessageEventTypes.MESSAGE_SENT, receivedMessage);
        });
        console.log("done emit");

        return res
            .status(201)
            .json(new ApiResponse(201, receivedMessage, "Message saved successfully"));

    
});

const sendMessagetoReply = asyncHandler(async (req, res) => {
    const { chatId, replyTo } = req.params;
    const { content } = req.body;
    const userId = req.headers['user-id'];

    if (!userId) {
        return res.status(401).json(new ApiError(401, "User ID is required"));
    }

    if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json(new ApiError(400, "Invalid User ID format"));
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new ApiError(404, "User not found"));
    }

    if (!content && !(req.files?.attachments?.length > 0)) {
        return res.status(400).json(new ApiError(400, "Message content or attachment is required"));
    }

    const selectedChat = await Chat.findById(chatId);
    if (!selectedChat) {
        return res.status(404).json(new ApiError(404, "Chat does not exist"));
    }

    const messageFiles = [];
    if (req.files && req.files.attachments?.length > 0) {
        req.files.attachments.map((attachment) => {
            messageFiles.push({
                url: getStaticFilePath(req, attachment.filename),
                localPath: getLocalPath(attachment.filename),
            });
        });
    }

    const msgId = await generateHash(`${chatId}-${userId}-${Date.now()}`);

    let replyFields = {};

    if (replyTo) {
        const originalMessage = await ChatMessage.findById(replyTo);
        if (originalMessage) {
            replyFields = {
                msg_reply_status: true,
                msg_reply_hash: originalMessage._id,
                msg_reply_title: originalMessage.msg_text.slice(0, 30),
                msg_reply_text: originalMessage.msg_text,
                msg_reply_user_dhondi_id: originalMessage.msg_sender_amorr_id,
                msg_reply_color: "#FFD700",
            };
        }
    }

    const message = await ChatMessage.create({
        msg_hash: msgId,
        msg_conversation_hash: chatId,
        msg_sender_amorr_id: userId,
        msg_timestamp: Date.now(),
        msg_added_time: Date.now(),
        msg_updated_time: Date.now(),
        msg_sent_status: true,
        msg_deleted_status: false,
        msg_text: content || "",
        msg_mediaUrl: messageFiles,
        ...replyFields,
    });

    const chat = await Chat.findByIdAndUpdate(
        chatId,
        {
            $set: {
                lastMessage: message._id,
            },
        },
        { new: true }
    );

    const receivedMessage = await ChatMessage.findById(message._id)
        .populate("msg_sender_amorr_id", "isOnline username")
        .populate("msg_conversation_hash", "name isGroup userBlocked lastMessage");

    if (!receivedMessage) {
        return res.status(500).json(new ApiError(500, "Internal server error"));
    }

    chat.participants.forEach(async(participantObjectId) => {
        if (participantObjectId.toString() === userId.toString()) return;

        emitSocketEvent(
            req,
            participantObjectId.toString(),
            ChatEventEnum.MESSAGE_RECEIVED_EVENT,
            receivedMessage
        );

        await sendNotification(req, participantObjectId.toString(), MessageEventTypes.MESSAGE_REPLIED, receivedMessage);
    });
    console.log("done emit");

    return res.status(201).json(new ApiResponse(201, receivedMessage, "Message saved successfully"));


});

const deleteMessage = asyncHandler(async (req, res) => {
        const { chatId, messageId } = req.params;

        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(401).json(new ApiError(401, "User ID is required"));
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }
        req.user = user;

        const chat = await Chat.findOne({
            _id: chatId,
            participants: req.user._id,
        });

        if (!chat) {
            return res.status(404).json(new ApiError(404, "Chat does not exist"));
        }

        const message = await ChatMessage.findById(messageId);

        if (!message) {
            return res.status(404).json(new ApiError(404, "Message does not exist"));
        }

        if (message.msg_sender_amorr_id.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "You are not authorized to delete the message; you are not the sender")
            );
        }

        await ChatMessage.updateOne(
            { _id: messageId },
            { $set: { msg_deleted_status: true } }
        );


        if (chat.lastMessage.toString() === message._id.toString()) {
            const lastMessage = await ChatMessage.findOne(
                { msg_conversation_hash: chatId, msg_deleted_status: true },
                {},
                { sort: { msg_timestamp: -1 } }
            );

            await Chat.findByIdAndUpdate(chatId, {
                lastMessage: lastMessage ? lastMessage._id : null,
            });
        }

        chat.participants.forEach((participantObjectId) => {
            if (participantObjectId.toString() === req.user._id.toString()) return;

            emitSocketEvent(
                req,
                participantObjectId.toString(),
                ChatEventEnum.MESSAGE_DELETE_EVENT,
                message
            );
        });

        return res.status(200).json(new ApiResponse(200, message, "Message deleted successfully"));
   
});

export {
    getAllMessagesofChat,
    getUserConvfromGroup,
    sendMessage,
    sendMessagetoReply,
    deleteMessage
};
