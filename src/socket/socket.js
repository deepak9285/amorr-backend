import { Server } from "socket.io";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { GameSession } from "../models/game.model.js";
import { ChatMessage } from "../models/message.model.js";
import { ChatEventEnum } from "./chatEvents.js";
import { v4 as uuidv4 } from "uuid";
const userSocketMap = new Map();

const setupSocketIO = (httpServer) => {
    const io = new Server(httpServer, {
        pingTimeout: 60000,
        cors: {
            origin: ["http://192.168.220.48:8005","*"],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            credentials: true,
        },
    });

    io.on("connection", async (socket) => {
        console.log(`debugger line 21 : a new socket connection is estabilished by ${socket.id}`)
        try {

            socket.on("joinChat", ({ chatId }) => {
                socket.join(chatId);
                console.log("joined chat", chatId);
            });

            const userId = socket.handshake.query.userId;
            console.log("userID",userId);

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

            //Game Requests
            socket.on("gameChallengeRequest", async ({ senderId, receiverId }) => {
                console.log(`debugger line 221 : "gameChallengeRequest" hit by ${socket.id}`)
                userSocketMap.set(userId, socket.id);
                const receiverSocketId = userSocketMap.get(receiverId);

                const session = new GameSession({
                    sessionId: uuidv4(),
                    sender: senderId,
                    receiver: receiverId,
                    requestTime: new Date(),
                    status: "requested",
                });
                await session.save();

                // Notify the receiver about the game challenge
                io.to(receiverSocketId).emit("receiveGameChallenge", {
                    sessionId: session.sessionId,
                    senderId: session.sender,
                    requestTime: new Date(),
                });
                
            });

            if (userId) {
                userSocketMap.set(userId, socket.id); // Map User ID to Socket ID

                // Handle disconnection and clean up mapping
                socket.on("disconnect", () => {
                    userSocketMap.delete(userId);
                    console.log(`User ${userId} disconnected`);
                });

                socket.on("gameChallengeRequest", async ({ senderId, receiverId }) => {
                    const receiverSocketId = userSocketMap.get(receiverId); // Get receiver's Socket ID

                    if (receiverSocketId) {
                        // Notify receiver about the game challenge
                        io.to(receiverSocketId).emit("receiveGameChallenge", {
                            sessionId: uuidv4(),
                            senderId,
                            requestTime: new Date(),
                        });
                    } else {
                        console.log("Receiver is not online");
                    }
                });
            }

            socket.on("gameChallengeAccept", async ({ sessionId, receiverId }) => {
                const session = await GameSession.findOne({ sessionId, receiver: receiverId });
                console.log(`debugger line 270 : "gameChallengeAccept" hit by ${socket.id}`)
                if (session && session.status === "requested") {
                    session.acceptanceTime = new Date();
                    session.status = "accepted";
                    await session.save();

                    // Notify the sender that the challenge was accepted
                    io.to(session.sender).emit("challengeAccepted", {
                        sessionId: session.sessionId,
                        receiverId: session.receiver,
                        acceptanceTime: session.acceptanceTime,
                    });

                    // Also notify the receiver to start the game
                    io.to(session.receiver).emit("challengeAccepted", {
                        sessionId: session.sessionId,
                        senderId: session.sender,
                        acceptanceTime: session.acceptanceTime,
                    });
                }
            });

            socket.on("gameScoreUpdate", async ({ sessionId, userId, userScore }) => {
                console.log(`debugger line 293 : "gameScoreUpdate" hit by ${socket.id}`)
                try {
                    
                    const session = await GameSession.findOne({ sessionId });
                    if (!session) {
                        console.error(`Session ${sessionId} not found`);
                        return;
                    }
            
                    
                    if (session.status !== "accepted") {
                        console.error(`Session ${sessionId} is not in accepted status`);
                        return;
                    }
            
                    
                    if (session.sender === userId) {
                        session.senderScore = userScore;
                    } else if (session.receiver === userId) {
                        session.receiverScore = userScore;
                    } else {
                        console.error(`User ${userId} is not part of the session ${sessionId}`);
                        return;
                    }
            
                    
                    await session.save();
            
                    
                    io.to(sessionId).emit("scoreUpdated", {
                        sessionId: session.sessionId,
                        senderScore: session.senderScore,
                        receiverScore: session.receiverScore,
                    });
                } catch (error) {
                    console.error("Error in gameScoreUpdate handler:", error);
                }
            });

            socket.on("endGame", async ({ sessionId, senderScore, receiverScore }) => {
                const session = await GameSession.findOne({ sessionId });
                console.log(`debugger line 334 : "endGame" hit by ${socket.id}`)
                if (session && session.status === "accepted") {
                    session.endTime = new Date();
                    session.senderScore = senderScore;
                    session.receiverScore = receiverScore;
                    session.status = "completed";
                    await session.save();

                    // Notify both players that the game has ended
                    io.to(session.sender).emit("gameEnded", {
                        sessionId: session.sessionId,
                        senderScore: session.senderScore,
                        receiverScore: session.receiverScore,
                        endTime: session.endTime,
                    });
                    io.to(session.receiver).emit("gameEnded", {
                        sessionId: session.sessionId,
                        senderScore: session.senderScore,
                        receiverScore: session.receiverScore,
                        endTime: session.endTime,
                    });
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
