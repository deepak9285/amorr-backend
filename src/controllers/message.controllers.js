import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ChatMessage } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError, handleErr } from "../utils/apiError.js";

const emitSocketEvent = (req, roomId, event, payload) => {
    req.app.get("io").in(roomId).emit(event, payload);
};

const sendMessage = (async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;

        const userId = req.headers['user-id'];
        if (!userId) {
            return new ApiError(401, "User ID is required");
        }
        const user = await User.findById(userId);
        if (!user) {
            return new ApiError(404, "User not found");
        }
        req.user = user;


        if (!content) {
            return new ApiError(400, "Message content is required");
        }

        const selectedChat = await Chat.findById(chatId);

        if (!selectedChat) {
            return new ApiError(404, "Chat does not exist");
        }

        const message = await ChatMessage.create({
            sender: new mongoose.Types.ObjectId(req.user._id),
            content: content || "",
            chat: new mongoose.Types.ObjectId(chatId),
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
            .populate("sender")
            .populate("chat");

        if (!receivedMessage) {
            return new ApiError(500, "Internal server error");
        }

        chat.participants.forEach((participantObjectId) => {
            if (participantObjectId.toString() === req.user._id.toString()) return;

            emitSocketEvent(
                req,
                participantObjectId.toString(),
                ChatEventEnum.MESSAGE_RECEIVED_EVENT,
                receivedMessage
            );
        });

        return res
            .status(201)
            .json(new ApiResponse(201, receivedMessage, "Message saved successfully"));
    }
    catch (err) {
        console.error("Error in createOrGetAOneOnOneChat:", err);
        return handleErr(res, err);
    }

});

const getAllMessages = async (req, res) => {
    try {
        const { chatId } = req.params;

        const selectedChat = await Chat.findById(chatId);
        if (!selectedChat) {
            return new ApiError(404, "Chat does not exist");
        }

        const userId = req.headers['user-id'];
        if (!userId) {
            return new ApiError(401, "User ID is required");
        }
        const user = await User.findById(userId);
        if (!user) {
            return new ApiError(404, "User not found");
        }
        req.user = user;

        if (!selectedChat.participants?.includes(req.user._id)) {
            return new ApiError(400, "User is not a part of this chat");
        }

        const messages = await ChatMessage.find({ chat: chatId })
            .sort({ createdAt: -1 })
            .populate("sender", "_id username")
            .populate("chat", "createdAt");

        return res
            .status(200)
            .json(new ApiResponse(200, messages || [], "Messages fetched successfully"));

    }
    catch (err) {
        console.error("Error in createOrGetAOneOnOneChat:", err);
        handleErr(res, err);
    }

};

const deleteMessage = (async (req, res) => {

    const { chatId, messageId } = req.params;

    const userId = req.headers['user-id'];
    if (!userId) {
        return new ApiError(401, "User ID is required");
    }
    const user = await User.findById(userId);
    if (!user) {
        return new ApiError(404, "User not found");
    }
    req.user = user;

    const chat = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(chatId),
        participants: req.user?._id,
    });

    if (!chat) {
        return new ApiError(404, "Chat does not exist");
    }

    const message = await ChatMessage.findOne({
        _id: new mongoose.Types.ObjectId(messageId),
    });

    if (!message) {
        return new ApiError(404, "Message does not exist");
    }

    if (message.sender.toString() !== req.user._id.toString()) {
        return new ApiError(
            403,
            "You are not the authorised to delete the message, you are not the sender"
        );
    }

    await ChatMessage.deleteOne({
        _id: new mongoose.Types.ObjectId(messageId),
    });

    if (chat.lastMessage.toString() === message._id.toString()) {
        const lastMessage = await ChatMessage.findOne(
            { chat: chatId },
            {},
            { sort: { createdAt: -1 } }
        );

        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: lastMessage ? lastMessage?._id : null,
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

    return res
        .status(200)
        .json(new ApiResponse(200, message, "Message deleted successfully"));
});


export {
    sendMessage,
    getAllMessages,
    deleteMessage
};
