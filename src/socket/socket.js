import { Server } from "socket.io";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { ChatMessage } from "../models/message.model.js";
import { ChatEventEnum } from "./chatEvents.js";

const setupSocketIO = (httpServer) => {
    const io = new Server(httpServer, {
        pingTimeout: 60000,
        cors: {
            origin: ["http://localhost:3000"],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            credentials: true,
        },
    });

    io.on("connection", async (socket) => {

        try {
            
            socket.on("joinChat", ({ chatId }) => {
                socket.join(chatId);
            });

            const userId = socket.handshake.query.userId;

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastActive: new Date()
                });
                console.log(`User ${userId} connected`);

                io.emit("userStatusUpdate", { userId, isOnline: true });
            }

            socket.on("connected", async (data) => {
                const { newUserId } = data;
                if (newUserId) {
                    await User.findByIdAndUpdate(newUserId, {
                        isOnline: true,
                        lastActive: new Date(),
                    });
                    console.log(`User ${newUserId} connected via userConnected event`);

                    io.emit("userStatusUpdate", { userId: newUserId, isOnline: true });
                }
            });

            socket.on("disconnect", async () => {
                if (userId) {
                    await User.findByIdAndUpdate(userId, {
                        isOnline: false,
                        lastActive: new Date()
                    });
                    console.log(`User ${userId} disconnected`);

                    io.emit("userStatusUpdate", { userId, isOnline: false });
                }
            });

            socket.on("typing", ({ chatId, userId, isTyping }) => {
                socket.broadcast.to(chatId).emit("userTyping", {
                    userId,
                    isTyping
                });
            });

            socket.on("sendMessage", async (messageData) => {
                const {
                    msg_hash,
                    msg_conversation_hash,
                    msg_sender_amorr_id,
                    msg_text,
                    msg_timestamp,
                    msg_reply_status,
                    msg_reply_hash,
                    msg_reply_title,
                    msg_reply_color,
                    msg_reply_text,
                    msg_reply_user_amorr_id,
                    msg_institution_code,
                    msg_institution_hash,
                    msg_mediaUrl,
                    msg_fileSize
                } = messageData;

                try {
                    const newMessage = new ChatMessage({
                        msg_hash,
                        msg_conversation_hash,
                        msg_sender_amorr_id,
                        msg_text,
                        msg_timestamp: new Date(msg_timestamp),
                        msg_added_time: new Date(),
                        msg_updated_time: new Date(),
                        msg_sent_status: true,
                        msg_reply_status: msg_reply_status || false,
                        msg_reply_hash,
                        msg_reply_title,
                        msg_reply_color,
                        msg_reply_text,
                        msg_reply_user_amorr_id,
                        msg_institution_code,
                        msg_institution_hash,
                        msg_mediaUrl,
                        msg_fileSize: msg_fileSize || 0
                    });

                    await newMessage.save();

                    io.to(msg_conversation_hash).emit("newMessage", newMessage);

                } catch (error) {
                    console.error("Error sending message:", error);
                }
            });

            socket.on("messageSeen", async ({ msg_hash, userId }) => {
                try {
                    const message = await ChatMessage.findOne({ msg_hash });

                    if (message) {
                        if (!message.seenBy.includes(userId)) {
                            message.seenBy.push(userId);
                            await message.save();

                            io.to(message.msg_conversation_hash).emit("messageSeenUpdate", {
                                msg_hash,
                                userId,
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error marking message as seen:", error);
                }
            });

            socket.on("deleteMessage", async ({ msg_hash, userId, deleteForEveryone }) => {
                try {
                    const message = await ChatMessage.findOne({ msg_hash });

                    if (message) {
                        if (deleteForEveryone) {
                            await ChatMessage.deleteOne({ msg_hash });

                            io.to(message.msg_conversation_hash).emit("messageDeleted", {
                                msg_hash,
                                deletedFor: "everyone",
                            });
                        } else {
                            message.msg_deleted_status = true;
                            await message.save();

                            socket.emit("messageDeleted", {
                                msg_hash,
                                deletedFor: userId,
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error deleting message:", error);
                }
            });

            socket.on("fetchConversation", async ({ chatId }, callback) => {
                try {
                    const messages = await ChatMessage.find({ msg_conversation_hash: chatId })
                        .sort({ msg_timestamp: 1 });

                    callback({ success: true, messages });
                } catch (error) {
                    console.error("Error fetching conversation:", error);
                    callback({ success: false, error: "Failed to fetch conversation" });
                }
            });

            socket.on("blockUser", async ({ chatId, userId, blockedUserId }) => {
                try {
                    const chat = await Chat.findById(chatId);
                    if (chat) {
                        chat.userBlocked = true;
                        chat.whoBlocked = blockedUserId;
                        await chat.save();

                        // Notify other participants
                        socket.broadcast.to(chatId).emit("userBlocked", {
                            userId,
                            blockedUserId,
                        });
                    }
                } catch (error) {
                    console.error(error);
                }
            });

            socket.on("unblockUser", async ({ chatId, userId }) => {
                try {
                    const chat = await Chat.findById(chatId);
                    if (chat) {
                        chat.userBlocked = false;
                        chat.whoBlocked = null;
                        await chat.save();

                        // Notify other participants
                        socket.broadcast.to(chatId).emit("userUnblocked", {
                            userId,
                        });
                    }
                } catch (error) {
                    console.error(error);
                }
            });

        } catch (error) {
            socket.emit(
                ChatEventEnum.SOCKET_ERROR_EVENT,
                error?.message || "Something went wrong while connecting to the socket."
            );
        }
    });

    return io;
};

const emitSocketEvent = (req, roomId, event, payload) => {
    req.app.get("io").in(roomId).emit(event, payload);
};

export { setupSocketIO, emitSocketEvent };
