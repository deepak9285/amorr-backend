import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
    {
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
    },
    { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);
