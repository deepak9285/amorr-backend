import { GameSession } from "../models/game.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.model.js";
import { ChatMessage } from "../models/message.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import generateHash from "../utils/generateHash.js";
import { ApiError } from "../utils/apiError.js";
//import  generateHash  from "../utils/generateHash.js";
import { v4 as uuidv4 } from "uuid";

const getGameSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        return new ApiError(400, "Session ID is required");
    }
    const gameSession = await GameSession.findOne({ sessionId });
    if (!gameSession) {
        return new ApiError(404, "Game session not found");
    }
    return res.status(200).json(new ApiResponse(200, gameSession, "Game session fetched successfully"));
});
const createGameSession = asyncHandler(async (req, res) => {
    const { senderId, receiverId, chatId } = req.body;
    console.log("atart");
    console.log(senderId, receiverId, chatId);
    if (!senderId || !receiverId) {
        return new ApiError(400, "Sender and Receiver IDs are required");
    }
    if (!chatId) {
        return new ApiError(400, "Chat ID is required");
    }
    const newGameSession = new GameSession({
        sessionId: uuidv4(),
        sender: senderId,
        receiver: receiverId,
        requestTime: new Date(),
        status: "requested",
    });

    const msgId = await generateHash(`${chatId}-${senderId}-${Date.now()}`) || new mongoose.Types.ObjectId().toString();
    const message = await ChatMessage.create({
        msg_hash: msgId,
        msg_conversation_hash: chatId,
        msg_sender_amorr_id: senderId,
        msg_timestamp: Date.now(),
        msg_added_time: Date.now(),
        msg_updated_time: Date.now(),
        msg_sent_status: true,
        msg_deleted_status: false,
        msg_text: "Game session request",
        msg_reply_status: false,
        msg_task_status: true
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

    await newGameSession.save();
    return res.status(201).json(new ApiResponse(201, newGameSession, receivedMessage,"Game session created successfully"));
});

export {
    getGameSession,
    createGameSession
};
