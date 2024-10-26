import { Server } from "socket.io";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";

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

        socket.on("userConnected", async (data) => {
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
    
    });

    return io;
};

export default setupSocketIO;
