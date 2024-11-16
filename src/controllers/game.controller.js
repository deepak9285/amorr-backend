import { GameSession } from "../models/game.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
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
    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId) {
        return new ApiError(400, "Sender and Receiver IDs are required");
    }
    const newGameSession = new GameSession({
        sessionId: uuidv4(),
        sender: senderId,
        receiver: receiverId,
        requestTime: new Date(),
        status: "requested",
    });
    await newGameSession.save();
    return res.status(201).json(new ApiResponse(201, newGameSession, "Game session created successfully"));
});

export {
    getGameSession,
    createGameSession
};
