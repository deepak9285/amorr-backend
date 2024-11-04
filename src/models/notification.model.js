import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["message", "like", "mention","reply"],
        },
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        chat: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
        },
        message: {
            type: Schema.Types.ObjectId,
            ref: "ChatMessage",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
