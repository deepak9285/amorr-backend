import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
    {
        chatId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },

        isGroup: {
            type: Boolean,
            default: false,
        },

        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],

        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "ChatMessage",
        },

        firstMessage: {
            type: Schema.Types.ObjectId,
            ref: "ChatMessage",
        },

        manualTimestamp: {
            type: Date,
            default: Date.now,
        },

        userBlocked: {
            type: Boolean,
            default: false,
        },

        whoBlocked: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        admin: {
            type: String,
            ref: "User",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export const Chat = mongoose.model("Chat", chatSchema);
