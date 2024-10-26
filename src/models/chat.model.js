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
            type: String,
            ref: "ChatMessage",
        },

        firstMessage: {
            type: Schema.Types.ObjectId,
            ref: "ChatMessage",
        },

    },
    { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);
