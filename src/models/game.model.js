import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const gameSessionSchema = new Schema(
    {
        sessionId: {
            type: String,
            default: uuidv4,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        requestTime: {
            type: Date,
            default: Date.now,
        },
        acceptanceTime: {
            type: Date,
        },
        endTime: {
            type: Date,
        },
        senderScore: {
            type: Number,
            default: 0,
        },
        receiverScore: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["requested", "accepted", "completed"],
            default: "requested",
        },
    },
    {
        timestamps: true,
    }
);

export const GameSession = mongoose.model("GameSession", gameSessionSchema);
