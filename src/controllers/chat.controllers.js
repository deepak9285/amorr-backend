import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError, handleErr } from "../utils/apiError.js";

const emitSocketEvent = (req, roomId, event, payload) => {
    req.app.get("io").in(roomId).emit(event, payload);
};

const createOrGetAOneOnOneChat = async (req, res) => {
    try {
        const { receiverId } = req.params;

        const userId = req.headers['user-id'];
        if (!userId) {
            return res.json(new ApiError(401, "User ID is required"));
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.json(new ApiError(404, "User not found"));
        }
        req.user = user;


        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.json(new ApiError(404, "Receiver does not exist"));
        }

        if (receiver._id.toString() === req.user._id.toString()) {
            return res.json(new ApiError(400, "You cannot chat with yourself"));
        }

        const chat = await Chat.findOne({
            participants: { $all: [req.user._id, receiver._id] },
        }).populate("participants", "username profileID email");

        if (chat) {
            return res
                .status(200)
                .json(new ApiResponse(200, chat, "Chat retrieved successfully"));
        }

        const newChatInstance = await Chat.create({
            participants: [req.user._id, new mongoose.Types.ObjectId(receiverId)],
        });

        await newChatInstance.save();
        const createdChat = await Chat.findById(newChatInstance._id)
            .populate("participants", "username profileID email");

        if (!createdChat) {
            return res.json(new ApiError(500, "Internal server error"));
        }

        createdChat.participants.forEach((participant) => {
            if (participant._id.toString() !== req.user._id.toString()) {
                emitSocketEvent(
                    req,
                    participant._id.toString(),
                    ChatEventEnum.NEW_CHAT_EVENT,
                    { chat: createdChat, sender: req.user }
                );
            }
        });

        return res
            .status(201)
            .json(new ApiResponse(201, createdChat, "Chat created successfully"));
    } catch (err) {
        console.error("Error in createOrGetAOneOnOneChat:", err);
        return handleErr(res, err);
    }
};
const getAllChats = async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.json(new ApiError(401, "User ID is required"));
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.json(new ApiError(404, "User not found"));
        }
        console.log(user);

        req.user = user;

        const chats = await Chat.find({
            participants: user._id,
        })
            .sort({ updatedAt: -1 })
            .populate("participants", "username profileID email");

        return res
            .status(200)
            .json(new ApiResponse(200, chats || [], "User chats fetched successfully!"));
    } catch (err) {
        console.error("Error in getAllChats:", err);
        return handleErr(res, err);
    }
};

export {
    createOrGetAOneOnOneChat,
    getAllChats
};