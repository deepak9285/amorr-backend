import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema(
    {
        msg_hash: {
            type: String,
            required: true,
            unique: true,
        },
        msg_conversation_hash: {
            type: String,
            ref: 'Chat',
            required: true,
        },
        msg_sender_amorr_id: {
            type: String,
            ref: 'User',
            required: true
        },
        msg_sender_profileId:{
            type:String,
            ref:'Profile',
        },
        msg_timestamp: {
            type: Date,
            required: true,
        },
        msg_added_time: {
            type: Date,
            required: true,
        },
        msg_updated_time: {
            type: Date,
            required: true,
        },
        msg_sent_status: {
            type: Boolean,
            required: true,
        },
        msg_deleted_status: {
            type: Boolean,
            required: true,
            default: false,
        },
        msg_text: {
            type: String,
        },
        msg_reply_status: {
            type: Boolean,
        },
        msg_task_status: {
            type: Boolean,
        },
        msg_reply_hash: {
            type: String,
        },
        msg_reply_title: {
            type: String,
        },
        msg_reply_color: {
            type: String,
        },
        msg_reply_text: {
            type: String,
        },
        msg_reply_user_amorr_id: {
            type: String,
        },
        msg_institution_code: {
            type: String,
        },
        msg_institution_hash: {
            type: String,
        },
        msg_mediaUrl: {
            type: [
                {
                    url: String,
                    localPath: String,
                },
            ],
            default: [],
        },
        msg_fileSize: {
            type: Number,
            default: 0
        },
        seenBy: [{
            type: Schema.Types.ObjectId,
            ref: "User",
        }]
    }
);

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
