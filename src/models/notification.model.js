import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["message", "like", "mention"],
        },
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        chat: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
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
